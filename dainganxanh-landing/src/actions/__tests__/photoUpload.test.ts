/**
 * Unit Tests: photoUpload.ts
 *
 * Covers: uploadPhotoToStorage (storage.upload + getPublicUrl),
 *         createTreePhotoRecord (DB insert), batchUploadPhotos (batch orchestration),
 *         getLotsForUpload (lots fetch).
 */

import {
  uploadPhotoToStorage,
  createTreePhotoRecord,
  batchUploadPhotos,
  getLotsForUpload,
} from '../photoUpload'

// ── Mock state ───────────────────────────────────────────────────────────────

const mockStorageUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockDbInsert = jest.fn()
const mockDbSelect = jest.fn()

const mockSupabase = {
  storage: {
    from: jest.fn(() => ({
      upload: mockStorageUpload,
      getPublicUrl: mockGetPublicUrl,
    })),
  },
  from: jest.fn((table: string) => {
    if (table === 'tree_photos') {
      return {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: mockDbInsert,
          })),
        })),
      }
    }
    if (table === 'lots') {
      return {
        select: jest.fn(() => ({
          order: mockDbSelect,
        })),
      }
    }
    return {}
  }),
}

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

// ── uploadPhotoToStorage ──────────────────────────────────────────────────────

describe('uploadPhotoToStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('[P0] returns public URL on successful upload', async () => {
    mockStorageUpload.mockResolvedValue({ data: { path: 'lot1/2025-01-01/abc.webp' }, error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/abc.webp' } })

    const file = new File(['data'], 'photo.webp', { type: 'image/webp' })
    const result = await uploadPhotoToStorage(file, 'lot1', 'full')

    expect(result.error).toBeNull()
    expect(result.data?.url).toBe('https://cdn.test/abc.webp')
  })

  it('[P0] returns error when storage upload fails', async () => {
    mockStorageUpload.mockResolvedValue({ data: null, error: { message: 'Storage quota exceeded' } })

    const file = new File(['data'], 'photo.webp', { type: 'image/webp' })
    const result = await uploadPhotoToStorage(file, 'lot1', 'full')

    expect(result.data).toBeNull()
    expect(result.error).toBe('Storage quota exceeded')
  })

  it('[P1] uses thumbnail suffix for thumbnail type', async () => {
    mockStorageUpload.mockResolvedValue({ data: { path: 'lot1/2025-01-01/abc_thumb.webp' }, error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/abc_thumb.webp' } })

    const file = new File(['data'], 'thumb.webp', { type: 'image/webp' })
    const result = await uploadPhotoToStorage(file, 'lot1', 'thumbnail')

    expect(result.error).toBeNull()
    expect(result.data?.url).toContain('_thumb')
  })
})

// ── createTreePhotoRecord ─────────────────────────────────────────────────────

describe('createTreePhotoRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('[P0] returns photo id on successful insert', async () => {
    mockDbInsert.mockResolvedValue({ data: { id: 'photo-123' }, error: null })

    const result = await createTreePhotoRecord({
      lotId: 'lot1',
      photoUrl: 'https://cdn.test/full.webp',
      thumbnailUrl: 'https://cdn.test/thumb.webp',
      gps: { lat: 10.5, lng: 106.5, accuracy: 5 },
      capturedAt: '2025-01-01T10:00:00Z',
      caption: 'Test photo',
    })

    expect(result.error).toBeNull()
    expect(result.data?.id).toBe('photo-123')
  })

  it('[P0] returns error when DB insert fails', async () => {
    mockDbInsert.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })

    const result = await createTreePhotoRecord({
      lotId: 'lot1',
      photoUrl: 'https://cdn.test/full.webp',
      thumbnailUrl: 'https://cdn.test/thumb.webp',
      gps: null,
      capturedAt: null,
    })

    expect(result.data).toBeNull()
    expect(result.error).toBe('Insert failed')
  })

  it('[P1] handles null GPS gracefully', async () => {
    mockDbInsert.mockResolvedValue({ data: { id: 'photo-456' }, error: null })

    const result = await createTreePhotoRecord({
      lotId: 'lot1',
      photoUrl: 'https://cdn.test/full.webp',
      thumbnailUrl: 'https://cdn.test/thumb.webp',
      gps: null,
      capturedAt: null,
    })

    expect(result.error).toBeNull()
    expect(result.data?.id).toBe('photo-456')
  })
})

// ── batchUploadPhotos ────────────────────────────────────────────────────────

describe('batchUploadPhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('[P0] returns successCount=1 failedCount=0 when all uploads succeed', async () => {
    mockStorageUpload.mockResolvedValue({ data: { path: 'lot1/2025-01-01/abc.webp' }, error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/abc.webp' } })
    mockDbInsert.mockResolvedValue({ data: { id: 'photo-1' }, error: null })

    const photo = {
      full: new File(['d'], 'full.webp', { type: 'image/webp' }),
      thumbnail: new File(['d'], 'thumb.webp', { type: 'image/webp' }),
      gps: null,
      capturedAt: null,
    }

    const result = await batchUploadPhotos([photo], 'lot1')
    expect(result.data?.successCount).toBe(1)
    expect(result.data?.failedCount).toBe(0)
  })

  it('[P1] increments failedCount when full upload fails', async () => {
    mockStorageUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } })

    const photo = {
      full: new File(['d'], 'full.webp', { type: 'image/webp' }),
      thumbnail: new File(['d'], 'thumb.webp', { type: 'image/webp' }),
      gps: null,
      capturedAt: null,
    }

    const result = await batchUploadPhotos([photo], 'lot1')
    expect(result.data?.failedCount).toBe(1)
    expect(result.data?.successCount).toBe(0)
    expect(result.error).toContain('1 photos failed')
  })

  it('[P1] reports partial failures across mixed batch', async () => {
    // First upload succeeds (full + thumb + record), second upload fails
    mockStorageUpload
      .mockResolvedValueOnce({ data: { path: 'p1.webp' }, error: null })
      .mockResolvedValueOnce({ data: { path: 'p1_thumb.webp' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'fail' } })

    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/p.webp' } })
    mockDbInsert.mockResolvedValue({ data: { id: 'p1' }, error: null })

    const makePhoto = () => ({
      full: new File(['d'], 'f.webp', { type: 'image/webp' }),
      thumbnail: new File(['d'], 't.webp', { type: 'image/webp' }),
      gps: null,
      capturedAt: null,
    })

    const result = await batchUploadPhotos([makePhoto(), makePhoto()], 'lot1')
    expect(result.data?.successCount).toBe(1)
    expect(result.data?.failedCount).toBe(1)
  })
})

// ── getLotsForUpload ──────────────────────────────────────────────────────────

describe('getLotsForUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('[P1] returns list of lots on success', async () => {
    const lots = [
      { id: 'lot1', name: 'Lô 1', region: 'Tây Nguyên' },
      { id: 'lot2', name: 'Lô 2', region: 'Tây Nguyên' },
    ]
    mockDbSelect.mockResolvedValue({ data: lots, error: null })

    const result = await getLotsForUpload()
    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(2)
    expect(result.data?.[0].name).toBe('Lô 1')
  })

  it('[P1] returns error when DB query fails', async () => {
    mockDbSelect.mockResolvedValue({ data: null, error: { message: 'Fetch error' } })

    const result = await getLotsForUpload()
    expect(result.data).toBeNull()
    expect(result.error).toBe('Fetch error')
  })
})
