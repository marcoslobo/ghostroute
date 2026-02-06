import { getSupabaseClient, isEventProcessed } from '../utils/db.ts';

export interface IdempotencyKey {
  vaultId: string;
  eventId: string;
}

export interface IdempotencyResult {
  shouldProcess: boolean;
  existingEventId?: string;
}

export class IdempotencyService {
  private client: ReturnType<typeof getSupabaseClient>;

  constructor() {
    this.client = getSupabaseClient();
  }

  async check(key: IdempotencyKey): Promise<IdempotencyResult> {
    const processed = await isEventProcessed(key.vaultId, key.eventId);

    if (processed) {
      return {
        shouldProcess: false,
        existingEventId: key.eventId,
      };
    }

    return { shouldProcess: true };
  }

  async recordProcessing(
    vaultId: string,
    eventId: string
  ): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('processed_events')
      .insert({
        vault_id: vaultId,
        event_id: eventId,
        event_type: 'pending',
        block_number: 0,
        status: 'pending',
      })
      .onConflict('vault_id, event_id')
      .ignore();

    if (error) {
      throw new Error(`Failed to record processing: ${error.message}`);
    }
  }

  async completeProcessing(
    vaultId: string,
    eventId: string,
    eventType: string,
    blockNumber: number,
    commitmentHash: string | null,
    nullifierHash: string | null,
    leafIndex?: number | null
  ): Promise<void> {
    const client = getSupabaseClient();
    const updateData: Record<string, any> = {
      event_type: eventType,
      block_number: blockNumber,
      commitment_hash: commitmentHash,
      nullifier_hash: nullifierHash,
      status: 'confirmed',
    };

    // Add leaf_index only for NewCommitment events
    if (leafIndex !== undefined && leafIndex !== null) {
      updateData.leaf_index = leafIndex;
    }

    const { error } = await client
      .from('processed_events')
      .update(updateData)
      .eq('vault_id', vaultId)
      .eq('event_id', eventId);

    if (error) {
      throw new Error(`Failed to complete processing: ${error.message}`);
    }
  }

  async failProcessing(vaultId: string, eventId: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('processed_events')
      .delete()
      .eq('vault_id', vaultId)
      .eq('event_id', eventId)
      .eq('status', 'pending');

    if (error) {
      throw new Error(`Failed to fail processing: ${error.message}`);
    }
  }

  static createKey(vaultId: string, eventId: string): string {
    return `${vaultId}:${eventId}`;
  }

  static parseKey(key: string): IdempotencyKey {
    const [vaultId, eventId] = key.split(':');
    if (!vaultId || !eventId) {
      throw new Error(`Invalid idempotency key format: ${key}`);
    }
    return { vaultId, eventId };
  }
}

export const idempotencyService = new IdempotencyService();
