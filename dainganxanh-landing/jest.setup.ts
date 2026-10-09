import '@testing-library/jest-dom'
import { jest } from '@jest/globals'

// Polyfill TextEncoder/TextDecoder for jsdom (required by fetch/supabase deps)
import { TextEncoder, TextDecoder } from 'util'
Object.assign(global, { TextEncoder, TextDecoder })

// Mock next/cache globally — revalidatePath/revalidateTag require Next.js server
// runtime (Request global) which is unavailable in Jest/jsdom
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
    unstable_cache: jest.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

// Set NODE_ENV for render shim
Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    configurable: true,
})

// Mock next-intl/server for Server Components in Jest
jest.mock('next-intl/server', () => {
    const fs = require('fs')
    const path = require('path')
    const messagesByLocale: Record<string, Record<string, unknown>> = { vi: {}, en: {} }
    try {
        for (const loc of ['vi', 'en']) {
            const messagesDir = path.join(__dirname, 'messages', loc)
            if (fs.existsSync(messagesDir)) {
                const files = fs.readdirSync(messagesDir)
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const ns = file.replace('.json', '')
                        messagesByLocale[loc][ns] = JSON.parse(fs.readFileSync(path.join(messagesDir, file), 'utf8'))
                    }
                }
            }
        }
    } catch {}

    function getByPath(obj: unknown, pathStr: string): string | undefined {
        const val = pathStr.split('.').reduce<unknown>((acc: unknown, part: string) => {
            if (acc && typeof acc === 'object') {
                return (acc as Record<string, unknown>)[part]
            }
            return undefined
        }, obj)
        return typeof val === 'string' ? val : undefined
    }

    return {
        getTranslations: jest.fn(async (opts?: unknown) => {
            const ns = typeof opts === 'string' ? opts : (opts && typeof opts === 'object' && 'namespace' in opts) ? String((opts as { namespace?: unknown }).namespace || '') : ''
            const targetLocale = (opts && typeof opts === 'object' && 'locale' in opts && typeof (opts as any).locale === 'string')
                ? (opts as any).locale
                : (process.env.JEST_LOCALE || 'vi')
            const currentMessages = messagesByLocale[targetLocale] || messagesByLocale.vi

            const fn: any = (key: string, values?: Record<string, unknown>) => {
                const fullPath = ns ? `${ns}.${key}` : key
                const val = getByPath(currentMessages, fullPath)
                if (typeof val === 'string') {
                    if (!values) return val
                    return val.replace(/\{(\w+)\}/g, (_, k) => (values[k] !== undefined ? String(values[k]) : `{${k}}`))
                }
                return key
            }
            fn.has = (key: string) => {
                const fullPath = ns ? `${ns}.${key}` : key
                return getByPath(currentMessages, fullPath) !== undefined
            }
            fn.rich = (key: string, values?: Record<string, unknown>) => {
                const text = fn(key, values)
                if (typeof text !== 'string' || !values) return text
                const elements: any[] = []
                const tagRegex = /<(\w+)>([\s\S]*?)<\/\1>/g
                let lastIndex = 0
                let match
                let hasTags = false
                while ((match = tagRegex.exec(text)) !== null) {
                    hasTags = true
                    const [, tagName, content] = match
                    const tagFn = values[tagName]
                    if (match.index > lastIndex) {
                        elements.push(text.slice(lastIndex, match.index))
                    }
                    if (typeof tagFn === 'function') {
                        elements.push(tagFn(content))
                    } else {
                        elements.push(content)
                    }
                    lastIndex = tagRegex.lastIndex
                }
                if (!hasTags) return text
                if (lastIndex < text.length) {
                    elements.push(text.slice(lastIndex))
                }
                const React = require('react')
                return React.createElement(React.Fragment, null, ...elements)
            }
            fn.raw = (key: string) => {
                const fullPath = ns ? `${ns}.${key}` : key
                return getByPath(currentMessages, fullPath) ?? key
            }
            return fn
        }),
        setRequestLocale: jest.fn(),
        getLocale: jest.fn(async () => process.env.JEST_LOCALE || 'vi'),
        getMessages: jest.fn(async () => messagesByLocale[process.env.JEST_LOCALE || 'vi'] || messagesByLocale.vi),
    }
})

// Mock @/i18n/navigation for components rendering localized Link / useRouter / usePathname in tests
jest.mock('@/i18n/navigation', () => {
    const React = require('react')
    return {
        Link: React.forwardRef(({ href, children, prefetch: _prefetch, ...rest }: any, ref: any) =>
            React.createElement('a', { href, ref, ...rest }, children)
        ),
        useRouter: () => ({
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
        }),
        usePathname: () => '/',
        redirect: jest.fn(),
        getPathname: jest.fn((opts: any) => (typeof opts === 'string' ? opts : opts?.href ?? '/')),
    }
})


