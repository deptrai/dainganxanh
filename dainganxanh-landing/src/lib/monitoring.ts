/**
 * Structured error logger for server-side API routes.
 *
 * Outputs JSON-structured logs that can be ingested by any log aggregator
 * (Betterstack, Loki, Datadog, etc.) without requiring an SDK dependency.
 *
 * For Sentry integration: set SENTRY_DSN env var and install @sentry/nextjs.
 * This module will remain the call site — only the transport changes.
 *
 * Usage:
 *   import { captureError, captureMessage } from '@/lib/monitoring'
 *   captureError(err, { route: '/api/orders/cancel', userId: user.id })
 */

export interface ErrorContext {
    route?: string
    userId?: string
    orderId?: string
    action?: string
    [key: string]: unknown
}

/**
 * Capture and log an error with structured context.
 * In production: forwards to Sentry if DSN configured.
 * Always: emits a structured JSON log line to stdout.
 */
export function captureError(err: unknown, context: ErrorContext = {}): void {
    const entry = {
        level: 'error',
        timestamp: new Date().toISOString(),
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        ...context,
    }

    // Structured log — parseable by any log aggregator
    console.error(JSON.stringify(entry))

    // Forward to Sentry if configured (opt-in, no SDK required at import time)
    if (process.env.SENTRY_DSN && typeof (globalThis as any).__sentry_capture__ === 'function') {
        try {
            ;(globalThis as any).__sentry_capture__(err, { extra: context })
        } catch {
            // Sentry failure must never break the app
        }
    }
}

/**
 * Capture a non-error event with structured context (e.g. business metric).
 */
export function captureMessage(message: string, level: 'info' | 'warning' = 'info', context: ErrorContext = {}): void {
    const entry = {
        level,
        timestamp: new Date().toISOString(),
        message,
        ...context,
    }
    if (level === 'warning') {
        console.warn(JSON.stringify(entry))
    } else {
        console.log(JSON.stringify(entry))
    }
}

/**
 * Track API latency for performance monitoring.
 * Emits a structured metric log line.
 */
export function trackLatency(route: string, durationMs: number, meta: Record<string, unknown> = {}): void {
    // Only log slow requests (>500ms) to avoid log noise
    if (durationMs > 500 || process.env.NODE_ENV === 'development') {
        console.log(JSON.stringify({
            level: 'metric',
            type: 'api_latency',
            timestamp: new Date().toISOString(),
            route,
            durationMs,
            slow: durationMs > 500,
            ...meta,
        }))
    }
}
