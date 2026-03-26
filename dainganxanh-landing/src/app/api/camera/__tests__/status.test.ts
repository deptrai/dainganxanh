/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '../status/route'

// Mock the https module so the test doesn't need a live go2rtc server
jest.mock('https', () => ({
    Agent: jest.fn().mockImplementation(() => ({ rejectUnauthorized: false })),
}))

function makeRequest(stream?: string): NextRequest {
    const url = stream
        ? `http://localhost/api/camera/status?stream=${stream}`
        : 'http://localhost/api/camera/status'
    return new NextRequest(url)
}

function mockFetch(data: Record<string, unknown>, ok = true) {
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        json: async () => data,
    } as Response)
}

describe('GET /api/camera/status', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('returns { online: true, streaming: false } when stream exists but no active producer', async () => {
        mockFetch({
            farm: {
                producers: [{ bytes_recv: 0 }],
            },
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: false })
    })

    it('returns { online: true, streaming: true } when producer has bytes_recv > 0', async () => {
        mockFetch({
            farm: {
                producers: [{ bytes_recv: 1024 }],
            },
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: true })
    })

    it('returns { online: true, streaming: false } when producers array is empty', async () => {
        mockFetch({
            farm: {
                producers: [],
            },
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: false })
    })

    it('returns { online: false } when stream does not exist in go2rtc', async () => {
        mockFetch({
            other_stream: { producers: [] },
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        // streaming is always present in response; false when stream config missing
        expect(body).toEqual({ online: false, streaming: false })
    })

    it('returns { online: false } when go2rtc returns non-ok status', async () => {
        mockFetch({}, false)
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toMatchObject({ online: false })
    })

    it('returns { online: false } when fetch throws (server unreachable)', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toMatchObject({ online: false })
    })

    it('defaults to "farm" stream when no stream param provided', async () => {
        mockFetch({
            farm: { producers: [{ bytes_recv: 512 }] },
        })
        const res = await GET(makeRequest())
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: true })
    })

    it('accepts custom stream name via query param', async () => {
        mockFetch({
            'custom-cam': { producers: [{ bytes_recv: 100 }] },
        })
        const res = await GET(makeRequest('custom-cam'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: true })
    })

    it('streaming is false when producer has no bytes_recv field', async () => {
        mockFetch({
            farm: {
                producers: [{ connected: true }], // bytes_recv absent
            },
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: false })
    })

    it('streaming is true when at least one of multiple producers has bytes_recv > 0', async () => {
        mockFetch({
            farm: {
                producers: [
                    { bytes_recv: 0 },
                    { bytes_recv: 2048 },
                ],
            },
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: true })
    })
})
