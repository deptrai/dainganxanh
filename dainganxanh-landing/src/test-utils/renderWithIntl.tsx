import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import fs from 'fs'
import path from 'path'

function getMessagesDir(locale: 'vi' | 'en'): string {
  const candidates = [
    path.resolve(process.cwd(), 'messages', locale),
    path.resolve(process.cwd(), 'dainganxanh-landing', 'messages', locale),
    path.resolve(__dirname, '..', '..', 'messages', locale),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir
  }
  return candidates[0]
}

export function loadCatalog(locale: 'vi' | 'en'): Record<string, unknown> {
  const dir = getMessagesDir(locale)
  if (!fs.existsSync(dir)) {
    return {}
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
  const messages: Record<string, unknown> = {}
  for (const file of files) {
    const namespace = file.replace(/\.json$/, '')
    try {
      const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
      messages[namespace] = content
    } catch (err) {
      console.error(`Error loading catalog ${file} for locale ${locale}:`, err)
    }
  }
  return messages
}

let cachedViMessages: Record<string, unknown> | null = null
let cachedEnMessages: Record<string, unknown> | null = null

export function getCachedMessages(locale: 'vi' | 'en'): Record<string, unknown> {
  if (locale === 'en') {
    if (!cachedEnMessages) cachedEnMessages = loadCatalog('en')
    return cachedEnMessages
  }
  if (!cachedViMessages) cachedViMessages = loadCatalog('vi')
  return cachedViMessages
}

export interface RenderWithIntlOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: 'vi' | 'en'
  messages?: Record<string, unknown>
}

export function renderWithIntl(
  ui: ReactElement,
  options: RenderWithIntlOptions = {}
): RenderResult {
  const { locale = 'vi', messages, ...renderOptions } = options
  const resolvedMessages = messages || getCachedMessages(locale)

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider
        locale={locale}
        messages={resolvedMessages}
        timeZone="Asia/Ho_Chi_Minh"
      >
        {children}
      </NextIntlClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
