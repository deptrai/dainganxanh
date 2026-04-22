/**
 * Test Timing Fixtures (Node-side only)
 *
 * Named helpers for the few legitimate hard-wait sites that run in Node
 * context — primarily inside `page.route()` handlers that simulate backend
 * processing delays.
 *
 * Spec files use these so the call site documents intent ("mock server is
 * slow") instead of an opaque `setTimeout`. Audit trail is visible.
 *
 * Cannot be used inside `page.evaluate()` blocks (browser context); those
 * sites are individually justified in-place with comments.
 *
 * NEVER use to wait for UI state. Use Playwright's expect.poll(),
 * page.waitForResponse(), or locator.toBeVisible() for that.
 */

/**
 * Simulate backend processing latency inside a `page.route()` handler.
 * Use when the test needs to verify behavior under realistic server timing
 * (e.g. throughput tests, timeout fallback paths, backend retry windows).
 */
export const mockServerDelay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms))
