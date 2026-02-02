import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';
import {
  WebhookPayload,
  isNewCommitment,
  isNullifierSpent,
  validateNewCommitment,
  validateNullifierSpent,
  handleNewCommitment,
  handleNullifierSpent,
} from '../handlers/webhook.ts';
import { getSupabaseClient, isEventProcessed, recordProcessedEvent } from '../utils/db.ts';
import { vaultService } from '../handlers/events.ts';

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || '';

interface WebhookResponse {
  received: boolean;
  eventId: string;
  status: 'accepted' | 'duplicate' | 'error';
  timestamp: string;
}

function verifySignature(
  payload: string,
  signature: string
): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  const expectedSignature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const signatureBuffer = new Uint8Array(signature.length / 2 - 1);
  for (let i = 0; i < signatureBuffer.length; i++) {
    signatureBuffer[i] = parseInt(signature.slice(2 + i * 2, 4 + i * 2), 16);
  }

  return await crypto.subtle.timingSafeEqual(
    new Uint8Array(expectedSignature),
    signatureBuffer
  );
}

async function handleRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const signature = req.headers.get('X-Webhook-Signature') || '';

  try {
    const body = await req.text();
    const payload: WebhookPayload = JSON.parse(body);

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
    } else {
      result = await handleNullifierSpent(payload as any);
    }

    await recordProcessedEvent(
      vault.id,
      eventType,
      eventId,
      payload.block.number,
      eventType === 'NewCommitment' ? (payload as any).commitment.hash : null,
      eventType === 'NullifierSpent' ? (payload as any).nullifier.hash : null
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
