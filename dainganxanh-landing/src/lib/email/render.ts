import React from 'react'

/**
 * Render email React components to HTML.
 *
 * In the Next.js App Router production runtime, dynamic import of
 * `react-dom/server` is allowed inside an async function, but static
 * top-level imports are blocked. Jest (CommonJS) cannot resolve the
 * dynamic `import("react-dom/server")` used by `@react-email/render`,
 * so in test mode we fall back to a synchronous `renderToStaticMarkup`
 * from `react-dom/server`.
 */
export async function renderEmail(element: React.ReactElement): Promise<string> {
  if (process.env.NODE_ENV === 'test') {
    const { renderToStaticMarkup } = await import('react-dom/server')
    return '<!DOCTYPE html>' + renderToStaticMarkup(element)
  }

  const { render } = await import('@react-email/render')
  return render(element)
}
