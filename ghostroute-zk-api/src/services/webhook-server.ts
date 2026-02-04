/**
 * Webhook HTTP Server
 * 
 * Provides HTTP endpoints for processing webhook payloads
 * including single event, batch processing, and health checks.
 */

import { serve } from "std/http";
import {
  processWebhookPayload,
  processBatch,
  checkProcessorHealth,
  initProcessor,
} from "./event-processor.ts";
import { WebhookPayload, HealthStatus } from "../models/webhook-processor/types.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8080", 10);

/**
 * Parse JSON body from request.
 */
async function parseBody(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/**
 * Send JSON response.
 */
function jsonResponse(
  body: unknown,
  status: number = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Send error response.
 */
function errorResponse(
  message: string,
  code: string,
  status: number = 400,
): Response {
  return jsonResponse({
    success: false,
    error: message,
    code,
  }, status);
}

/**
 * Main request handler.
 */
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;

  // CORS headers for browser testing
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight requests
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Health check endpoint
    if (method === "GET" && url.pathname === "/health") {
      const health = await checkProcessorHealth();
      const status = health.database && health.merkleTree
        ? "healthy"
        : health.database
        ? "degraded"
        : "unhealthy";

      const healthStatus: HealthStatus = {
        status,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        checks: {
          database: health.database ? "connected" : "disconnected",
          merkleTree: health.merkleTree ? "ready" : "unavailable",
        },
      };

      const httpStatus = status === "healthy" ? 200 : status === "degraded" ? 200 : 503;
      return new Response(JSON.stringify(healthStatus), {
        status: httpStatus,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Single webhook processing
    if (method === "POST" && url.pathname === "/webhook") {
      const body = await parseBody(req);

      if (!body || typeof body !== "object") {
        return errorResponse(
          "Invalid request body: expected JSON object",
          "INVALID_BODY",
          400,
        );
      }

      // Ensure processor is initialized
      await initProcessor();

      const result = await processWebhookPayload(body as WebhookPayload);

      // Return 200 for success, 409 for duplicate
      const httpStatus = result.idempotent ? 200 : result.success ? 200 : 400;
      return new Response(JSON.stringify(result), {
        status: httpStatus,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Batch webhook processing
    if (method === "POST" && url.pathname === "/webhook/batch") {
      const body = await parseBody(req);

      if (!Array.isArray(body)) {
        return errorResponse(
          "Invalid request body: expected JSON array",
          "INVALID_BODY",
          400,
        );
      }

      if (body.length > 100) {
        return errorResponse(
          "Batch size exceeds maximum of 100 events",
          "BATCH_TOO_LARGE",
          400,
        );
      }

      // Ensure processor is initialized
      await initProcessor();

      const result = await processBatch(body as WebhookPayload[]);

      // Return 207 for partial success, 200 for all success
      const httpStatus = result.failed > 0 ? 207 : 200;
      return new Response(JSON.stringify(result), {
        status: httpStatus,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // 404 for unknown routes
    return errorResponse(
      `Route not found: ${method} ${url.pathname}`,
      "NOT_FOUND",
      404,
    );
  } catch (error) {
    console.error("Request handling error:", error);

    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      "INTERNAL_ERROR",
      500,
    );
  }
}

/**
 * Start the HTTP server.
 */
export async function startServer(): Promise<void> {
  console.log(`Starting webhook server on port ${PORT}...`);
  
  await initProcessor();
  
  serve(handler, {
    port: PORT,
    onListen: () => {
      console.log(`Webhook server listening on http://localhost:${PORT}`);
      console.log("Available endpoints:");
      console.log("  POST /webhook       - Process single webhook event");
      console.log("  POST /webhook/batch - Process batch of webhook events");
      console.log("  GET  /health        - Health check endpoint");
    },
  });
}

// Start server if running directly
if (import.meta.main) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    Deno.exit(1);
  });
}
