import { describe, it, expect, beforeEach } from '@jest/globals'
import {
    extractEXIF,
    compressImage,
    generateThumbnail,
    processPhotoForUpload,
    type GPSData,
} from '../imageProcessing'

// Mock browser-image-compression
jest.mock('browser-image-compression', () => ({
    __esModule: true,
    default: jest.fn(),
}))

// Mock exifr
jest.mock('exifr', () => ({
    parse: jest.fn(),
}))

import imageCompression from 'browser-image-compression'
import { parse as parseEXIF } from 'exifr'

describe('imageProcessing', () => {
    beforeEach(() => {
        jest.clearAllMocks()

            // Setup default mock implementation
            ; (imageCompression as jest.Mock).mockImplementation((file, options) => {
                // Simulate compression by creating a smaller file
                const size = options.maxSizeMB * 1024 * 1024 * 0.8 // 80% of max
                const blob = new Blob(['compressed'], { type: options.fileType || file.type })
                return Promise.resolve(new File([blob], file.name, { type: blob.type }))
            })
    })

    describe('extractEXIF', () => {
        it('should extract GPS data when available', async () => {
            const mockEXIF = {
                latitude: 10.762622,
                longitude: 106.660172,
                GPSHPositioningError: 5.2,
                DateTimeOriginal: '2026:01:13 10:30:00',
            }
                ; (parseEXIF as jest.Mock).mockResolvedValue(mockEXIF)

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            const result = await extractEXIF(file)

            expect(result.gps).toEqual({
                lat: 10.762622,
                lng: 106.660172,
                accuracy: 5.2,
            })
            expect(result.capturedAt).toBe('2026:01:13 10:30:00')
        })

        it('should return null GPS when coordinates not available', async () => {
            const mockEXIF = {
                DateTimeOriginal: '2026:01:13 10:30:00',
            }
                ; (parseEXIF as jest.Mock).mockResolvedValue(mockEXIF)

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            const result = await extractEXIF(file)

            expect(result.gps).toBeNull()
            expect(result.capturedAt).toBe('2026:01:13 10:30:00')
        })

        it('should handle missing EXIF data gracefully', async () => {
            ; (parseEXIF as jest.Mock).mockResolvedValue(null)

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            const result = await extractEXIF(file)

            expect(result.gps).toBeNull()
            expect(result.capturedAt).toBeNull()
        })

        it('should handle EXIF parsing errors', async () => {
            ; (parseEXIF as jest.Mock).mockRejectedValue(new Error('Parse error'))

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            const result = await extractEXIF(file)

            expect(result.gps).toBeNull()
            expect(result.capturedAt).toBeNull()
        })

        it('should use DateTime fallback when DateTimeOriginal missing', async () => {
            const mockEXIF = {
                latitude: 10.762622,
                longitude: 106.660172,
                DateTime: '2026:01:13 10:30:00',
            }
                ; (parseEXIF as jest.Mock).mockResolvedValue(mockEXIF)

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            const result = await extractEXIF(file)

            expect(result.capturedAt).toBe('2026:01:13 10:30:00')
        })
    })

    describe('compressImage', () => {
        it('should compress image to WebP format', async () => {
            const file = new File(['large image'], 'test.jpg', { type: 'image/jpeg' })
            const compressed = await compressImage(file)

            expect(imageCompression).toHaveBeenCalledWith(file, {
                maxSizeMB: 2,
                maxWidthOrHeight: 2000,
                useWebWorker: true,
                fileType: 'image/webp',
            })
            expect(compressed).toBeInstanceOf(File)
        })

        it('should throw error when compression fails', async () => {
            ; (imageCompression as jest.Mock).mockRejectedValue(new Error('Compression failed'))

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

            await expect(compressImage(file)).rejects.toThrow('Failed to compress image')
        })
    })

    describe('generateThumbnail', () => {
        it('should generate small thumbnail', async () => {
            const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
            const thumbnail = await generateThumbnail(file)

            expect(imageCompression).toHaveBeenCalledWith(file, {
                maxSizeMB: 0.1,
                maxWidthOrHeight: 300,
                useWebWorker: true,
                fileType: 'image/webp',
            })
            expect(thumbnail).toBeInstanceOf(File)
        })

        it('should throw error when thumbnail generation fails', async () => {
            ; (imageCompression as jest.Mock).mockRejectedValue(new Error('Thumbnail failed'))

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

            await expect(generateThumbnail(file)).rejects.toThrow('Failed to generate thumbnail')
        })
    })

    describe('processPhotoForUpload', () => {
        it('should process photo with GPS data', async () => {
            const mockEXIF = {
                latitude: 10.762622,
                longitude: 106.660172,
                GPSHPositioningError: 5.2,
                DateTimeOriginal: '2026:01:13 10:30:00',
            }
                ; (parseEXIF as jest.Mock).mockResolvedValue(mockEXIF)

            const file = new File(['test image'], 'photo.jpg', { type: 'image/jpeg' })
            const result = await processPhotoForUpload(file)

            expect(result.gps).toEqual({
                lat: 10.762622,
                lng: 106.660172,
                accuracy: 5.2,
            })
            expect(result.capturedAt).toBe('2026:01:13 10:30:00')
            expect(result.compressed).toBeInstanceOf(File)
            expect(result.thumbnail).toBeInstanceOf(File)
            expect(result.originalName).toBe('photo.jpg')
        })

        it('should process photo without GPS data', async () => {
            ; (parseEXIF as jest.Mock).mockResolvedValue({
                DateTimeOriginal: '2026:01:13 10:30:00',
            })

            const file = new File(['test image'], 'photo.jpg', { type: 'image/jpeg' })
            const result = await processPhotoForUpload(file)

            expect(result.gps).toBeNull()
            expect(result.capturedAt).toBe('2026:01:13 10:30:00')
            expect(result.compressed).toBeInstanceOf(File)
            expect(result.thumbnail).toBeInstanceOf(File)
        })

        it('should extract EXIF before compression', async () => {
            const mockEXIF = {
                latitude: 10.762622,
                longitude: 106.660172,
            }
                ; (parseEXIF as jest.Mock).mockResolvedValue(mockEXIF)

            const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
            await processPhotoForUpload(file)

            // Verify parseEXIF was called before imageCompression
            const parseCallOrder = (parseEXIF as jest.Mock).mock.invocationCallOrder[0]
            const compressCallOrder = (imageCompression as jest.Mock).mock.invocationCallOrder[0]

            expect(parseCallOrder).toBeLessThan(compressCallOrder)
        })
    })
})
