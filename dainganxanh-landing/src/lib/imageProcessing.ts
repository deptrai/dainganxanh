/**
 * Image Processing Library for Photo Upload with GPS
 * Handles EXIF extraction, image compression, and thumbnail generation
 * 
 * CRITICAL: EXIF data must be extracted BEFORE compression!
 * Compression removes EXIF metadata.
 */

import imageCompression from 'browser-image-compression'
import { parse as parseEXIF } from 'exifr'

export interface GPSData {
    lat: number
    lng: number
    accuracy?: number
}

export interface ProcessedPhoto {
    compressed: File
    thumbnail: File
    gps: GPSData | null
    capturedAt: string | null
    originalName: string
}

/**
 * Extract EXIF data including GPS coordinates from image file
 * @param file - Image file to extract EXIF from
 * @returns GPS data if available, null otherwise
 */
export async function extractEXIF(file: File): Promise<{
    gps: GPSData | null
    capturedAt: string | null
}> {
    try {
        const exif = await parseEXIF(file, {
            gps: true,
            pick: ['latitude', 'longitude', 'GPSHPositioningError', 'DateTimeOriginal', 'DateTime']
        })

        if (!exif) {
            return { gps: null, capturedAt: null }
        }

        const gps = exif.latitude && exif.longitude
            ? {
                lat: exif.latitude,
                lng: exif.longitude,
                accuracy: exif.GPSHPositioningError || undefined
            }
            : null

        const capturedAt = exif.DateTimeOriginal || exif.DateTime || null

        return { gps, capturedAt }
    } catch (error) {
        console.error('Error extracting EXIF:', error)
        return { gps: null, capturedAt: null }
    }
}

/**
 * Compress image to meet size requirements (< 2MB, max 2000px)
 * @param file - Image file to compress
 * @returns Compressed image file
 */
export async function compressImage(file: File): Promise<File> {
    try {
        const compressed = await imageCompression(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 2000,
            useWebWorker: true,
            fileType: 'image/webp', // Use WebP for better compression
        })

        return compressed
    } catch (error) {
        console.error('Error compressing image:', error)
        throw new Error('Failed to compress image')
    }
}

/**
 * Generate thumbnail from image (300px max dimension)
 * @param file - Image file to create thumbnail from
 * @returns Thumbnail file
 */
export async function generateThumbnail(file: File): Promise<File> {
    try {
        const thumbnail = await imageCompression(file, {
            maxSizeMB: 0.1,
            maxWidthOrHeight: 300,
            useWebWorker: true,
            fileType: 'image/webp',
        })

        return thumbnail
    } catch (error) {
        console.error('Error generating thumbnail:', error)
        throw new Error('Failed to generate thumbnail')
    }
}

/**
 * Complete photo processing pipeline
 * 1. Extract EXIF (BEFORE compression!)
 * 2. Compress image
 * 3. Generate thumbnail
 * 
 * @param file - Original image file
 * @returns Processed photo with compressed image, thumbnail, and metadata
 */
export async function processPhotoForUpload(file: File): Promise<ProcessedPhoto> {
    // Step 1: Extract EXIF BEFORE compression (compression removes EXIF!)
    const { gps, capturedAt } = await extractEXIF(file)

    // Step 2: Compress image
    const compressed = await compressImage(file)

    // Step 3: Generate thumbnail
    const thumbnail = await generateThumbnail(file)

    return {
        compressed,
        thumbnail,
        gps,
        capturedAt,
        originalName: file.name,
    }
}
