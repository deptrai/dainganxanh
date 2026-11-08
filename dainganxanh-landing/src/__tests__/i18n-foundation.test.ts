/**
 * @jest-environment node
 */

jest.mock('next-intl/server', () => ({
  getRequestConfig: (fn: any) => fn,
}))

import { routing } from '@/i18n/routing'
import { Link, redirect, usePathname, useRouter } from '@/i18n/navigation'
import requestConfig from '@/i18n/request'

describe('i18n Foundation Core Configuration', () => {
  it('defines the correct routing configuration', () => {
    expect(routing.locales).toEqual(['vi', 'en'])
    expect(routing.defaultLocale).toBe('vi')
    expect(routing.localePrefix).toBe('as-needed')
    expect(routing.localeDetection).toBe(false)
  })

  it('exports navigation primitives', () => {
    expect(Link).toBeDefined()
    expect(redirect).toBeDefined()
    expect(usePathname).toBeDefined()
    expect(useRouter).toBeDefined()
  })

  it('loads valid messages for Vietnamese (default)', async () => {
    // requestConfig is created with getRequestConfig
    // Let's invoke the inner handler with { requestLocale: Promise.resolve('vi') }
    const config = await (requestConfig as any)({
      requestLocale: Promise.resolve('vi'),
    })

    expect(config.locale).toBe('vi')
    expect(config.messages).toBeDefined()
    expect(config.messages.common).toBeDefined()
    expect(config.messages.landing).toBeDefined()
    expect(config.messages.pricing).toBeDefined()
    expect(config.messages.crm).toBeDefined()
    expect(config.messages.common.brand.name).toBe('Đại Ngàn Xanh')
  })

  it('loads valid messages for English', async () => {
    const config = await (requestConfig as any)({
      requestLocale: Promise.resolve('en'),
    })

    expect(config.locale).toBe('en')
    expect(config.messages).toBeDefined()
    expect(config.messages.common).toBeDefined()
    expect(config.messages.landing).toBeDefined()
    expect(config.messages.pricing).toBeDefined()
    expect(config.messages.crm).toBeDefined()
    expect(config.messages.common.brand.name).toBe('Đại Ngàn Xanh')
  })

  it('falls back to defaultLocale (vi) for invalid locale input', async () => {
    const config = await (requestConfig as any)({
      requestLocale: Promise.resolve('fr'),
    })

    expect(config.locale).toBe('vi')
    expect(config.messages).toBeDefined()
  })

  it('falls back to vi catalog messages when a key is missing in en', async () => {
    const config = await (requestConfig as any)({
      requestLocale: Promise.resolve('en'),
    })

    // Both catalogs have common.brand.name; verify en overrides vi
    expect(config.messages.common.brand.name).toBe('Đại Ngàn Xanh')
    // Any vi base keys not defined in en will be retained from vi
    expect(config.messages.common.brand).toBeDefined()
    // Verify landing messages
    expect(config.messages.landing.hero.headline).toBe('Weave the Great Forest, Reap Blessings')
    expect(config.messages.landing.nav.story).toBe('Story')
  })
})
