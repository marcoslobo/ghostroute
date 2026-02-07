import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  WebhookPayload,
  isNewCommitment,
  isNullifierSpent,
  isActionExecuted,
  validateNewCommitment,
  validateNullifierSpent,
  validateActionExecuted,
  handleNewCommitment,
  handleNullifierSpent,
  handleActionExecuted,
} from '../_shared/handlers/webhook.ts';
import { getSupabaseClient, isEventProcessed, recordProcessedEvent } from '../_shared/utils/db.ts';
import { vaultService } from '../_shared/handlers/events.ts';
import { adaptListenerPayload, isListenerFormat } from '../_shared/adapters/listener-adapter.ts';
import { ListenerEventPayload } from '../_shared/adapters/listener-types.ts';

interface WebhookResponse {
  received: boolean;
  eventId: string;
  status: 'accepted' | 'duplicate' | 'error' | 'ignored';
  timestamp: string;
  message?: string;
}

// SIGNATURE VERIFICATION DISABLED FOR DEVELOPMENT
// TODO: Re-enable when listener supports webhook signatures
// const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || '';

async function handleRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.text();
    const rawPayload = JSON.parse(body);

    // Detect payload format and adapt if needed
    let payload: WebhookPayload;

    if (isListenerFormat(rawPayload)) {
      // Listener format - needs adaptation
      console.log('[webhook] 🔄 Received listener format, adapting...');
      const adapted = adaptListenerPayload(rawPayload as ListenerEventPayload);

      if (!adapted) {
        // Event type doesn't need processing (e.g., MerkleRootUpdated, AnonymousWithdrawal)
        // Return success without processing
        console.log('[webhook] ℹ️  Event type does not require processing, returning success');
        return new Response(
          JSON.stringify({
            received: true,
            eventId: (rawPayload as ListenerEventPayload).Id,
            status: 'ignored',
            message: 'Event type does not require processing',
            timestamp: new Date().toISOString(),
          } as WebhookResponse),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      payload = adapted;
      console.log('[webhook] ✅ Successfully adapted to API format');
    } else if ('eventId' in rawPayload && 'commitment' in rawPayload) {
      // Already in API format (backward compatibility)
      console.log('[webhook] ℹ️  Received API format (no adaptation needed)');
      payload = rawPayload as WebhookPayload;
    } else {
      throw new Error(
        'Unknown payload format. Expected either listener format (with DecodedParametersNames) ' +
          'or API format (with eventId and commitment)'
      );
    }

    let eventId: string;
    let chainId: number;
    let vaultAddress: string;
    let eventType: string;

    if (isNewCommitment(payload)) {
      validateNewCommitment(payload);
      eventId = payload.eventId;
      chainId = payload.chainId;
      vaultAddress = payload.vaultAddress;
      eventType = 'NewCommitment';
    } else if (isNullifierSpent(payload)) {
      validateNullifierSpent(payload);
      eventId = payload.eventId;
      chainId = payload.chainId;
      vaultAddress = payload.vaultAddress;
      eventType = 'NullifierSpent';
    } else if (isActionExecuted(payload)) {
      validateActionExecuted(payload);
      eventId = payload.eventId;
      chainId = payload.chainId;
      vaultAddress = payload.vaultAddress;
      eventType = 'ActionExecuted';
    } else {
      throw new Error('Unknown payload type');
    }

    const vault = await vaultService.getOrCreateVault(chainId, vaultAddress);

    const isDuplicate = await isEventProcessed(vault.id, eventId);

    if (isDuplicate) {
      const response: WebhookResponse = {
        received: true,
        eventId,
        status: 'duplicate',
        timestamp: new Date().toISOString(),
      };

      return new Response(JSON.stringify(response), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result: { success: boolean; root?: string };

    if (eventType === 'NewCommitment') {
      result = await handleNewCommitment(payload as any);
    } else if (eventType === 'ActionExecuted') {
      result = await handleActionExecuted(payload as any);
    } else {
      result = await handleNullifierSpent(payload as any);
    }

    // Build idempotency key based on event type
    let idempotencyKey: string;
    if (eventType === 'NewCommitment') {
      idempotencyKey = `commitment:${(payload as any).commitment.hash}`;
    } else if (eventType === 'ActionExecuted') {
      // Use nullifierHash + block number for ActionExecuted idempotency
      idempotencyKey = `action:${(payload as any).nullifierHash}:${payload.block.number}`;
    } else {
      idempotencyKey = `nullifier:${(payload as any).nullifier.hash}`;
    }

    await recordProcessedEvent(
      vault.id,
      eventType,
      eventId,
      payload.block.number,
      eventType === 'NewCommitment' ? (payload as any).commitment.hash : 
        eventType === 'ActionExecuted' ? (payload as any).changeCommitment : null,
      eventType === 'NullifierSpent' ? (payload as any).nullifier.hash : 
        eventType === 'ActionExecuted' ? (payload as any).nullifierHash : null,
      eventType === 'NewCommitment' ? (payload as any).commitment.index :
        eventType === 'ActionExecuted' ? (payload as any).changeIndex : null
    );

    const response: WebhookResponse = {
      received: true,
      eventId,
      status: 'accepted',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    const response = {
      code: 'PROCESSING_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

serve(handleRequest, { port: 3001 });
