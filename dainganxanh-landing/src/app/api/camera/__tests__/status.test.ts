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

/**
 * Mock 2 sequential fetch calls made by route.ts:
 *   1st: GET /api/streams  → returns streamsData
 *   2nd: GET /api/frame.jpeg → returns frameOk + optional content-length
 */
function mockFetchSequence({
    streamsData,
    streamsOk = true,
    frameOk = false,
    frameContentLength = '0',
}: {
    streamsData: Record<string, unknown>
    streamsOk?: boolean
    frameOk?: boolean
    frameContentLength?: string
}) {
    global.fetch = jest.fn()
        .mockResolvedValueOnce({
            ok: streamsOk,
            json: async () => streamsData,
        } as Response)
        .mockResolvedValueOnce({
            ok: frameOk,
            headers: { get: (h: string) => h === 'content-length' ? frameContentLength : null },
        } as unknown as Response)
}

describe('GET /api/camera/status', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('returns { online: true, streaming: false } when stream exists but frame not available', async () => {
        mockFetchSequence({
            streamsData: { farm: { producers: [] } },
            frameOk: false,
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: false })
    })

    it('returns { online: true, streaming: true } when frame endpoint returns content', async () => {
        mockFetchSequence({
            streamsData: { farm: { producers: [] } },
            frameOk: true,
            frameContentLength: '12345',
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: true })
    })

    it('returns { online: true, streaming: false } when frame returns ok but content-length is 0', async () => {
        mockFetchSequence({
            streamsData: { farm: { producers: [] } },
            frameOk: true,
            frameContentLength: '0',
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: false })
    })

    it('returns { online: false } when stream does not exist in go2rtc', async () => {
        mockFetchSequence({
            streamsData: { other_stream: {} },
        })
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: false, streaming: false })
    })

    it('returns { online: false } when go2rtc /api/streams returns non-ok status', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({ ok: false } as Response)
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
        mockFetchSequence({
            streamsData: { farm: {} },
            frameOk: true,
            frameContentLength: '512',
        })
        const res = await GET(makeRequest())
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: true })
    })

    it('accepts custom stream name via query param', async () => {
        mockFetchSequence({
            streamsData: { 'custom-cam': {} },
            frameOk: true,
            frameContentLength: '100',
        })
        const res = await GET(makeRequest('custom-cam'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: true })
    })

    it('streaming is false when frame endpoint returns no content-length header', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ farm: {} }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                headers: { get: () => null },
            } as unknown as Response)
        const res = await GET(makeRequest('farm'))
        const body = await res.json()
        expect(body).toEqual({ online: true, streaming: false })
    })

    it('calls /api/streams then /api/frame.jpeg with correct stream name', async () => {
        mockFetchSequence({
            streamsData: { farm: {} },
            frameOk: true,
            frameContentLength: '1024',
        })
        await GET(makeRequest('farm'))
        const calls = (global.fetch as jest.Mock).mock.calls
        expect(calls[0][0]).toMatch(/\/api\/streams$/)
        expect(calls[1][0]).toMatch(/\/api\/frame\.jpeg\?src=farm/)
    })
})
