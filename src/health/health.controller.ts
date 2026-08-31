import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: 'ok';
}

/**
 * Lightweight liveness endpoint. Returns 200 with no dependency checks
 * (no DB), so it stays cheap and is safe to use for Docker HEALTHCHECK and
 * compose `depends_on: service_healthy`. A deeper readiness check (with DB)
 * can be added later for Kubernetes.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
