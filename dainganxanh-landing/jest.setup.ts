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
