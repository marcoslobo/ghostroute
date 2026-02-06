#!/usr/bin/env -S deno run --allow-all

/**
 * GhostRoute Event Listener
 * 
 * Listens to PrivacyVault events and forwards them to the webhook processor.
 * Runs on Deno Deploy for edge computing.
 */

const RPC_URL = Deno.env.get("RPC_URL") || "https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef'";
const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL") || "http://localhost:8080/webhook";
const VAULT_ADDRESS = Deno.env.get("VAULT_ADDRESS");

// Event signatures
const EVENT_SIGNATURES: Record<string, string> = {
  Deposit: "Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)",
  MerkleRootUpdated: "MerkleRootUpdated(bytes32,bytes32,uint256)",
  ActionExecuted: "ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)",
};

interface VaultEvent {
  eventName: string;
  transactionHash: string;
  logIndex: number;
  blockNumber: number;
  contractAddress: string;
  args: Record<string, string>;
}

interface WebhookPayload {
  TransactionHash: string;
  LogIndex: number;
  ContractAddress: string;
  BlockchainNetworkId: number;
  DecodedParametersNames: string[];
  DecodedParametersValues: string[];
  EventSignature: string;
}

class GhostRouteListener {
  private rpcUrl: string;
  private webhookUrl: string;
  private vaultAddress: string;
  private isRunning: boolean = false;

  constructor(rpcUrl: string, webhookUrl: string, vaultAddress: string) {
    this.rpcUrl = rpcUrl;
    this.webhookUrl = webhookUrl;
    this.vaultAddress = vaultAddress;
  }

  /**
   * Start listening for vault events
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Listener already running");
      return;
    }

    console.log("========================================");
    console.log("  GhostRoute Event Listener");
    console.log("========================================");
    console.log(`RPC URL: ${this.rpcUrl}`);
    console.log(`Webhook URL: ${this.webhookUrl}`);
    console.log(`Vault: ${this.vaultAddress}`);
    console.log("");

    this.isRunning = true;

    // Listen for past events
    await this.fetchPastEvents();

    // Listen for new events
    this.listenNewEvents();

    console.log("Listening for events... (Press Ctrl+C to stop)");
  }

  /**
   * Fetch past events from the vault
   */
  async fetchPastEvents(): Promise<void> {
    console.log("[HISTORY] Fetching past events...");

    try {
      // Get current block
      const blockParams = await this.rpcCall("eth_blockNumber", []);
      const currentBlock = parseInt(blockParams.result as string, 16);
      const fromBlock = Math.max(0, currentBlock - 1000);

      console.log(`[HISTORY] Scanning blocks ${fromBlock} to ${currentBlock}...`);

      // Get logs for the vault
      const logs = await this.getLogs(fromBlock, "latest");

      console.log(`[HISTORY] Found ${logs.length} events`);

      for (const log of logs) {
        const event = this.parseLog(log);
        if (event) {
          await this.sendToWebhook(event);
        }
      }
    } catch (error) {
      console.error("[HISTORY] Error:", error);
    }
  }

  /**
   * Listen for new events using polling
   */
  listenNewEvents(): void {
    console.log("[LIVE] Starting event listener...");

    let lastBlock = 0;

    const poll = async () => {
      if (!this.isRunning) return;

      try {
        const blockParams = await this.rpcCall("eth_blockNumber", []);
        const currentBlock = parseInt(blockParams.result as string, 16);

        if (currentBlock > lastBlock) {
          const logs = await this.getLogs(lastBlock + 1, "latest");

          for (const log of logs) {
            const event = this.parseLog(log);
            if (event) {
              console.log(`\n[EVENT] ${event.eventName}`);
              console.log(`  Block: ${event.blockNumber}`);
              console.log(`  Tx: ${event.transactionHash}`);
              await this.sendToWebhook(event);
            }
          }

          lastBlock = currentBlock;
        }
      } catch (error) {
        console.error("[POLL] Error:", error);
      }

      // Poll every 5 seconds
      setTimeout(poll, 5000);
    };

    poll();
  }

  /**
   * Get logs from the vault
   */
  async getLogs(fromBlock: number | string, toBlock: number | string): Promise<any[]> {
    // Get event signatures
    const signatures = Object.values(EVENT_SIGNATURES).map(s => this.keccak256(s));

    const params = [
      {
        fromBlock: typeof fromBlock === "number" ? `0x${fromBlock.toString(16)}` : fromBlock,
        toBlock: typeof toBlock === "number" ? `0x${toBlock.toString(16)}` : toBlock,
        address: this.vaultAddress,
        topics: [signatures],
      },
    ];

    const result = await this.rpcCall("eth_getLogs", params);
    return result.result || [];
  }

  /**
   * Parse log into structured event
   */
  parseLog(log: any): VaultEvent | null {
    try {
      // Find event name from signature
      const signature = log.topics[0];
      const eventName = Object.entries(EVENT_SIGNATURES).find(
        ([, sig]) => this.keccak256(sig) === signature
      )?.[0];

      if (!eventName) return null;

      // Parse args (simplified - would need full ABI for complete parsing)
      const args: Record<string, string> = {};
      const abiCoder = new TextEncoder();

      // Basic parsing for Deposit event
      if (eventName === "Deposit") {
        args.commitment = log.topics[1] || "0x0";
        args.nullifier = log.topics[2] || "0x0";
        args.token = log.topics[3] || "0x0";
        // Decode data field for remaining args
      }

      return {
        eventName,
        transactionHash: log.transactionHash,
        logIndex: parseInt(log.logIndex, 16),
        blockNumber: parseInt(log.blockNumber, 16),
        contractAddress: log.address,
        args,
      };
    } catch (error) {
      console.error("Error parsing log:", error);
      return null;
    }
  }

  /**
   * Send event to webhook processor
   */
  async sendToWebhook(event: VaultEvent): Promise<void> {
    try {
      const payload: WebhookPayload = {
        TransactionHash: event.transactionHash,
        LogIndex: event.logIndex,
        ContractAddress: event.contractAddress,
        BlockchainNetworkId: 11155111, // Sepolia
        DecodedParametersNames: Object.keys(event.args),
        DecodedParametersValues: Object.values(event.args),
        EventSignature: this.keccak256(`${event.eventName}(...)`),
      };

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`  ✓ Webhook sent`);
      } else {
        console.log(`  ✗ Webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`  ✗ Webhook error:`, error);
    }
  }

  /**
   * RPC call helper
   */
  async rpcCall(method: string, params: any[]): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });

    return response.json();
  }

  /**
   * Keccak256 hash
   */
  keccak256(data: string): string {
    // Simplified - would use proper hashing library
    return "0x" + Deno.run({
      cmd: ["cast", "keccak256", data],
      stdout: "piped",
    }).output().then(o => new TextDecoder().decode(o).trim());
  }

  /**
   * Stop the listener
   */
  stop(): void {
    this.isRunning = false;
    console.log("\nListener stopped");
  }
}

/**
 * Main entry point
 */
async function main() {
  if (!VAULT_ADDRESS) {
    console.error("Error: VAULT_ADDRESS environment variable required");
    console.log("Usage:");
    console.log("  VAULT_ADDRESS=0x... RPC_URL=... deno run --allow-all scripts/listener.ts");
    Deno.exit(1);
  }

  const listener = new GhostRouteListener(
    RPC_URL,
    WEBHOOK_URL,
    VAULT_ADDRESS
  );

  // Handle graceful shutdown
  Deno.addSignalListener("SIGINT", () => {
    console.log("\nShutting down...");
    listener.stop();
    Deno.exit(0);
  });

  Deno.addSignalListener("SIGTERM", () => {
    console.log("\nShutting down...");
    listener.stop();
    Deno.exit(0);
  });

  await listener.start();
}

main();
