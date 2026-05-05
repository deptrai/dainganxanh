import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for jsdom (required by fetch/supabase deps)
import { TextEncoder, TextDecoder } from 'util'
Object.assign(global, { TextEncoder, TextDecoder })

// Mock next/cache globally — revalidatePath/revalidateTag require Next.js server
// runtime (Request global) which is unavailable in Jest/jsdom
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
    unstable_cache: jest.fn().mockImplementation((fn: () => unknown) => fn),
}))
