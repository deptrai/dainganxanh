import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for jsdom (required by fetch/supabase deps)
import { TextEncoder, TextDecoder } from 'util'
Object.assign(global, { TextEncoder, TextDecoder })
