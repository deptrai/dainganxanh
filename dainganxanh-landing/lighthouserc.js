/** @type {import('@lhci/cli').LighthouseRcFile} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/blog',
        'http://localhost:3000/blog/ci-test-post-cay-do-den',
      ],
      numberOfRuns: 3,
      settings: {
        // Use desktop for stable LCP — mobile emulation is too slow on CI runners
        preset: 'desktop',
        // Skip PWA audits (not applicable)
        skipAudits: ['installable-manifest', 'splash-screen', 'themed-omnibox', 'maskable-icon'],
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Performance — NFR BNR-2: LCP ≤ 2.5s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        // Layout stability
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // Interactivity budget
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        // SEO — FR-30 SEO Core
        'categories:seo': ['error', { minScore: 0.9 }],
        // A11y — warn only until full audit done (Epic 7 incomplete)
        'categories:accessibility': ['warn', { minScore: 0.85 }],
        // Performance score — informational, not a gate
        'categories:performance': ['warn', { minScore: 0.8 }],
        // Not blocking on best-practices
        'categories:best-practices': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
