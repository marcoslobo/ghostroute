# GhostRoute — Complete Flow Diagram

## 1. Architecture Overview

```mermaid
graph TB
    subgraph BROWSER["🌐 Browser (Client)"]
        UI["ghostroute-ui\nNext.js + TypeScript"]
        LS["localStorage\n(Private notes)"]
        WASM["Noir WASM\n(ZK proof generation)"]
        UI <--> LS
        UI --> WASM
    end

    subgraph BLOCKCHAIN["⛓️ Blockchain (Sepolia / Mainnet)"]
        PV["PrivacyVault.sol\n(Core contract)"]
        PLH["PrivacyLiquidityHook.sol\n(Uniswap V4 Hook)"]
        VER["ZKVerifier.sol\n(Verifies Groth16 proofs)"]
        PM["PoolManager\n(Uniswap V4)"]
        MT["Merkle Tree\n(on-chain commitments)"]
        PV --> VER
        PV --> MT
        PV --> PLH
        PLH --> PM
    end

    subgraph API["🖥️ Backend (Deno + Supabase)"]
        ZK_API["ghostroute-zk-api\n(Edge Functions)"]
        DB["PostgreSQL\n(off-chain Merkle Tree)"]
        WH["Webhook Listener\n(blockchain events)"]
        ZK_API <--> DB
        WH --> DB
    end

    subgraph CIRCUITS["🔐 ZK Circuits (Noir)"]
        NR["main.nr\nGroth16 / Barretenberg"]
    end

    UI -- "RPC (viem/wagmi)" --> BLOCKCHAIN
    UI -- "REST API" --> ZK_API
    BLOCKCHAIN -- "Deposit/Action events" --> WH
    WASM --> NR
```

---

## 2. Deposit Flow

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant UI as ghostroute-ui<br/>(useDeposit.ts)
    participant LS as localStorage
    participant BC as PrivacyVault.sol
    participant API as ghostroute-zk-api
    participant DB as PostgreSQL

    User->>UI: Enters amount and token (e.g. 1 ETH)

    rect rgb(20, 40, 60)
        Note over UI: Local secret generation
        UI->>UI: salt = randomBytes(32)
        UI->>UI: nullifier_secret = randomBytes(32)
        UI->>UI: commitment = poseidon3([value, tokenId, salt])
        UI->>UI: Creates local note { commitment, nullifier, value, token }
    end

    rect rgb(20, 60, 40)
        Note over UI,BC: Blockchain transaction
        alt ETH
            UI->>BC: deposit(commitment, nullifier) { value: 1 ETH }
        else ERC20
            UI->>BC: approve(vault, amount)
            UI->>BC: depositERC20(token, amount, commitment, nullifier)
        end
        BC->>BC: commitments[commitment] = true
        BC->>BC: Inserts into Merkle Tree → updates currentRoot
        BC->>BC: nextLeafIndex++
        BC-->>UI: Emit Deposit(commitment, leafIndex, timestamp)
    end

    rect rgb(60, 20, 40)
        Note over UI,LS: Save note with leafIndex
        UI->>UI: Extracts leafIndex from Deposit event
        UI->>UI: note.leafIndex = leafIndex
        UI->>LS: addNote(full note)
    end

    rect rgb(40, 20, 60)
        Note over BC,DB: Backend syncs state
        BC-->>API: Webhook: Deposit event detected
        API->>DB: Inserts commitment into off-chain Merkle Tree
        API->>DB: Updates leafIndex and root
    end

    UI-->>User: ✅ Deposit confirmed! Note saved locally.
```

---

## 3. Pool Investment Flow

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant UI as ghostroute-ui<br/>(usePoolInvestment.ts)
    participant LS as localStorage
    participant WASM as Noir WASM<br/>(ZK circuit)
    participant API as ghostroute-zk-api
    participant BC as PrivacyVault.sol
    participant PLH as PrivacyLiquidityHook.sol
    participant PM as Uniswap V4<br/>PoolManager

    User->>UI: Selects note, pool and investment amount

    rect rgb(20, 40, 60)
        Note over UI: Preview calculation (no tx sent)
        UI->>UI: changeValue = note.value - investAmount - gasEstimate
        UI->>UI: changeSalt = randomBytes(32)
        UI->>UI: changeCommitment = poseidon3([changeValue, tokenId, changeSalt])
        UI->>UI: actionHash = keccak256(poolId, tickLower, tickUpper, amount0, amount1)
        UI->>UI: Creates local changeNote { changeValue, token, changeSalt }
        UI-->>User: Shows preview (change amount, actionHash)
    end

    User->>UI: Confirms investment

    rect rgb(60, 40, 20)
        Note over UI,WASM: ZK Proof generation<br/>(PRIVATE — stays in browser)
        UI->>UI: nullifierHash = keccak256(note.nullifier_secret)
        UI->>API: GET /merkle-path?leafIndex=N
        API-->>UI: { path: [20 hashes], root }
        Note over WASM: PRIVATE inputs (never leave the browser):
        Note over WASM: • full note { asset_id, amount, nullifier_secret, blinding }
        Note over WASM: • index (position in the tree)
        Note over WASM: • path (20 sibling hashes from the Merkle Tree)
        Note over WASM: • changeNote { asset_id, amount, nullifier_secret, blinding }
        Note over WASM: PUBLIC inputs (go on-chain):
        Note over WASM: • root, nullifierHash, changeCommitment
        Note over WASM: • is_withdrawal=false, actionHash, amount
        UI->>WASM: Runs main.nr circuit with inputs
        WASM->>WASM: assert: commitment(note) exists in Merkle Tree
        WASM->>WASM: assert: nullifierHash = pedersen(note.nullifier_secret)
        WASM->>WASM: assert: note.amount == investAmount + changeNote.amount
        WASM->>WASM: assert: note.asset_id == changeNote.asset_id
        WASM->>WASM: assert: commitment(changeNote) == changeCommitment
        WASM-->>UI: proof (compressed Groth16 bytes)
    end

    rect rgb(20, 60, 40)
        Note over UI,BC: Blockchain transaction
        UI->>BC: executeAction(<br/>  proof,<br/>  root,<br/>  nullifierHash,<br/>  changeCommitment,<br/>  actionHash,<br/>  investAmount,<br/>  uniswapParams<br/>)
        BC->>BC: ZKVerifier.verify(proof, publicInputs) ✓
        BC->>BC: nullifiers[nullifierHash] == false? ✓ (not spent)
        BC->>BC: root == currentRoot? ✓ (proof is current)
        BC->>BC: actionHash != 0? ✓
        BC->>BC: Sets nullifiers[nullifierHash] = true
        BC->>BC: Inserts changeCommitment into Merkle Tree
        BC->>BC: currentRoot = keccak256(currentRoot || changeCommitment)
        BC->>BC: nextLeafIndex++
        BC->>PLH: addLiquidityWithPrivacy(poolKey, liquidityParams, proof, publicInputs)
        PLH->>PLH: Validates authorization via transient storage (EIP-1153)
        PLH->>PLH: computeLiquidityActionHash(key, params, vault) == actionHash ✓
        PLH->>PM: modifyLiquidity(poolKey, liquidityParams)
        PM-->>PLH: Liquidity added ✓
        PLH-->>BC: Emit PrivacyLiquidityAdded(poolId, liquidity, actionHash)
        BC-->>UI: Emit ActionExecuted(nullifier, changeCommitment, actionHash, amount, changeIndex)
    end

    rect rgb(60, 20, 40)
        Note over UI,LS: Update local state
        UI->>LS: markAsSpent(note.commitment, txHash)
        UI->>UI: changeNote.leafIndex = changeIndex (from event)
        UI->>LS: addNote(changeNote)
    end

    UI-->>User: ✅ Investment confirmed! Change note saved.
```

---

## 4. Withdrawal Flow

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant UI as ghostroute-ui<br/>(useWithdraw.ts)
    participant LS as localStorage
    participant WASM as Noir WASM<br/>(ZK circuit)
    participant API as ghostroute-zk-api
    participant BC as PrivacyVault.sol

    User->>UI: Selects note, amount and recipient address

    rect rgb(20, 40, 60)
        Note over UI: Change calculation
        UI->>UI: changeValue = note.value - withdrawAmount
        UI->>UI: changeCommitment = poseidon3([changeValue, tokenId, changeSalt])
        UI->>UI: actionHash = pedersen(recipient, withdrawAmount)
        Note over UI: ⚠️ recipient is INSIDE the actionHash<br/>Any tampering invalidates the proof!
    end

    rect rgb(60, 40, 20)
        Note over UI,WASM: ZK Proof generation
        UI->>UI: nullifierHash = keccak256(note.nullifier_secret)
        UI->>API: GET /merkle-path?leafIndex=N
        API-->>UI: { path: [20 hashes], root }
        UI->>WASM: Runs circuit with is_withdrawal=true
        WASM->>WASM: assert: commitment(note) exists in Merkle Tree
        WASM->>WASM: assert: nullifierHash = pedersen(note.nullifier_secret)
        WASM->>WASM: assert: note.amount == withdrawAmount + changeNote.amount
        WASM->>WASM: assert: note.asset_id == changeNote.asset_id
        WASM->>WASM: assert: commitment(changeNote) == changeCommitment
        WASM->>WASM: assert: actionHash == pedersen(recipient, withdrawAmount) ✓ ← key difference!
        WASM-->>UI: proof (Groth16 bytes)
    end

    rect rgb(20, 60, 40)
        Note over UI,BC: Blockchain transaction
        UI->>BC: withdraw(<br/>  proof,<br/>  root,<br/>  nullifierHash,<br/>  changeCommitment,<br/>  actionHash,<br/>  withdrawAmount,<br/>  recipient<br/>)
        BC->>BC: ZKVerifier.verify(proof, publicInputs) ✓
        BC->>BC: nullifiers[nullifierHash] == false? ✓
        BC->>BC: root == currentRoot? ✓
        BC->>BC: Recomputes: actionHash == pedersen(recipient, amount)? ✓
        BC->>BC: Sets nullifiers[nullifierHash] = true
        BC->>BC: Inserts changeCommitment into Merkle Tree
        BC->>BC: currentRoot = keccak256(currentRoot || changeCommitment)
        alt ETH
            BC->>User: transfer(recipient, withdrawAmount) 💸
        else ERC20
            BC->>User: IERC20(token).transfer(recipient, withdrawAmount) 💸
        end
        BC-->>UI: Emit Withdrawal(nullifier, changeCommitment, recipient, amount)
    end

    rect rgb(60, 20, 40)
        Note over UI,LS: Update local state
        UI->>LS: markAsSpent(note.commitment, txHash)
        UI->>LS: addNote(changeNote) ← change stays in vault
    end

    UI-->>User: ✅ Withdrawal confirmed! Funds sent to recipient.
```

---

## 5. ZK Circuit Internals (main.nr)

```mermaid
flowchart TD
    subgraph PRIV["🔒 PRIVATE Inputs (never leave the browser)"]
        N["note {\n  asset_id\n  amount\n  nullifier_secret\n  blinding\n}"]
        IDX["index\n(position in Merkle Tree)"]
        PATH["path[20]\n(sibling hashes)"]
        CN["changeNote {\n  asset_id\n  amount\n  nullifier_secret\n  blinding\n}"]
    end

    subgraph PUB["🌐 PUBLIC Inputs (go on-chain)"]
        ROOT["root\n(Merkle Tree root)"]
        NH["nullifierHash"]
        CC["changeCommitment"]
        IW["is_withdrawal\n(bool)"]
        AH["actionHash"]
        AMT["amount"]
        RCP["recipient"]
    end

    subgraph CIRCUIT["⚙️ Circuit Logic (main.nr)"]
        S1["1. leaf = pedersen(note.asset_id,\n   note.amount,\n   note.nullifier_secret,\n   note.blinding)"]
        S2["2. computedRoot = merkle_proof(leaf, index, path)\nassert computedRoot == root ✓"]
        S3["3. computedNullifier = pedersen(note.nullifier_secret)\nassert computedNullifier == nullifierHash ✓"]
        S4["4. assert note.amount == amount + changeNote.amount ✓\n(UTXO balance — no value created from nothing)"]
        S5["5. assert note.asset_id == changeNote.asset_id ✓\n(same token)"]
        S6["6. computedCC = pedersen(changeNote.*)\nassert computedCC == changeCommitment ✓"]
        S7{"is_withdrawal?"}
        S8["7a. computedAH = pedersen(recipient, amount)\nassert computedAH == actionHash ✓\n(recipient locked inside proof)"]
        S9["7b. actionHash pass-through\n(contract validates pool parameters)"]
        PROOF["✅ Groth16 proof generated\n(compact bytes)"]

        S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
        S7 -- "true (withdrawal)" --> S8 --> PROOF
        S7 -- "false (investment)" --> S9 --> PROOF
    end

    PRIV --> CIRCUIT
    PUB --> CIRCUIT
```

---

## 6. UTXO Model — Note Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: User deposits

    state Created {
        note: commitment = poseidon3(value, tokenId, salt)
        nullifier: nullifier_secret (stored locally)
        leaf: leafIndex (extracted from Deposit event)
    }

    Created --> Active: Tx confirmed + leafIndex saved

    state Active {
        unspent: nullifiers[nullifierHash] == false
        stored: Note in localStorage
    }

    Active --> Spent: executeAction() or withdraw()
    Active --> Backup: User exports JSON

    state Spent {
        spent: nullifiers[nullifierHash] = true
        blocked: Cannot be reused
    }

    Spent --> ChangeCreated: changeNote generated
    ChangeCreated --> Active: changeNote becomes new active note

    Backup --> Active: Import on another device
    Spent --> [*]
```

---

## 7. Comparison: Deposit vs Investment vs Withdrawal

```mermaid
graph LR
    subgraph DEP["DEPOSIT"]
        direction TB
        D1["User sends ETH/ERC20"] --> D2["Generates commitment\n(poseidon3)"]
        D2 --> D3["vault.deposit(commitment)"]
        D3 --> D4["Note created with leafIndex"]
    end

    subgraph INV["INVESTMENT"]
        direction TB
        I1["Existing note as capital"] --> I2["Generates changeCommitment\n+ actionHash (pool params)"]
        I2 --> I3["ZK Proof\n(is_withdrawal=false)"]
        I3 --> I4["vault.executeAction(...)"]
        I4 --> I5["Note spent → Pool liquidity\n+ changeNote (change)"]
    end

    subgraph WIT["WITHDRAWAL"]
        direction TB
        W1["Existing note to withdraw"] --> W2["Generates changeCommitment\n+ actionHash (recipient+amount)"]
        W2 --> W3["ZK Proof\n(is_withdrawal=true)"]
        W3 --> W4["vault.withdraw(recipient...)"]
        W4 --> W5["Note spent → ETH to recipient\n+ changeNote (change)"]
    end

    DEP -- "creates note" --> INV
    DEP -- "creates note" --> WIT
    INV -- "creates changeNote" --> INV
    INV -- "creates changeNote" --> WIT
```

---

## 8. Privacy — Why Is It Private?

```mermaid
graph TD
    A["Blockchain observer<br/>(can see EVERYTHING on-chain)"] --> B{What do they see?}

    B --> C["✅ VISIBLE:\nnullifierHash (random bytes32)\nchangeCommitment (random bytes32)\nactionHash (random bytes32)\nproof (compact bytes)\nGas spent"]

    B --> D["❌ INVISIBLE:\nWhich note was spent\nHow much was in the note\nWho owns the note\nWhere the money goes\nWhich pool was invested\nWho the owner is"]

    C --> E["Reveals NOTHING about:\nuser identity,\noriginal deposited amount,\ntransaction history"]

    D --> F["ZK proof guarantees:\nThe user OWNS the note\nwithout revealing WHICH note it is"]
```
