import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { checkDatabaseConnection } from '../_shared/utils/db.ts';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  checks: {
    database: boolean;
    merkleTree: boolean;
  };
  uptime: number;
}

let startTime = Date.now();

async function handleRequest(): Promise<Response> {
  const checks: { database: boolean; merkleTree: boolean } = {
    database: false,
    merkleTree: false,
  };

  try {
    checks.database = await checkDatabaseConnection();
    checks.merkleTree = true;
  } catch (error) {
    console.error('Health check error:', error);
  }

  const allHealthy = checks.database && checks.merkleTree;
  const status = allHealthy ? 'healthy' : checks.database ? 'degraded' : 'unhealthy';

  const response: HealthCheckResponse = {
    status,
    version: '1.0.0',
    checks,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  const statusCode = allHealthy ? 200 : checks.database ? 200 : 503;

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

serve(handleRequest, { port: 3001 });
