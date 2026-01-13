'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { GPSData } from '@/lib/imageProcessing'

export interface UploadPhotoData {
    lotId: string
    photoUrl: string
    thumbnailUrl: string
    gps: GPSData | null
    capturedAt: string | null
    caption?: string
}

/**
 * Upload photo to Supabase Storage
 * Path: tree-photos/{lotId}/{date}/{photoId}.webp
 */
export async function uploadPhotoToStorage(
    file: File,
    lotId: string,
    type: 'full' | 'thumbnail' = 'full'
): Promise<{ data: { url: string } | null; error: string | null }> {
    try {
        const supabase = await createServerClient()

        // Generate unique filename
        const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const photoId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const suffix = type === 'thumbnail' ? '_thumb' : ''
        const filename = `${photoId}${suffix}.webp`
        const path = `${lotId}/${date}/${filename}`

        // Upload to storage
        const { data, error } = await supabase.storage
            .from('tree-photos')
            .upload(path, file, {
                contentType: 'image/webp',
                upsert: false,
            })

        if (error) {
            console.error('Storage upload error:', error)
            return { data: null, error: error.message }
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from('tree-photos').getPublicUrl(data.path)

        return { data: { url: publicUrl }, error: null }
    } catch (error) {
        console.error('Upload error:', error)
        return { data: null, error: 'Failed to upload photo' }
    }
}

/**
 * Create tree_photos record in database
 */
export async function createTreePhotoRecord(
    data: UploadPhotoData
): Promise<{ data: { id: string } | null; error: string | null }> {
    try {
        const supabase = await createServerClient()

        const { data: photo, error } = await supabase
            .from('tree_photos')
            .insert({
                lot_id: data.lotId,
                photo_url: data.photoUrl,
                caption: data.caption || null,
                taken_at: data.capturedAt,
                gps_lat: data.gps?.lat || null,
                gps_lng: data.gps?.lng || null,
                gps_accuracy: data.gps?.accuracy || null,
            })
            .select('id')
            .single()

        if (error) {
            console.error('Database insert error:', error)
            return { data: null, error: error.message }
        }

        return { data: { id: photo.id }, error: null }
    } catch (error) {
        console.error('Create record error:', error)
        return { data: null, error: 'Failed to create photo record' }
    }
}

/**
 * Batch upload photos (full + thumbnail) and create records
 */
export async function batchUploadPhotos(
    photos: Array<{
        full: File
        thumbnail: File
        gps: GPSData | null
        capturedAt: string | null
        caption?: string
    }>,
    lotId: string
): Promise<{
    data: { successCount: number; failedCount: number } | null
    error: string | null
}> {
    try {
        let successCount = 0
        let failedCount = 0

        for (const photo of photos) {
            // Upload full image
            const fullResult = await uploadPhotoToStorage(photo.full, lotId, 'full')
            if (fullResult.error || !fullResult.data) {
                failedCount++
                continue
            }

            // Upload thumbnail
            const thumbResult = await uploadPhotoToStorage(photo.thumbnail, lotId, 'thumbnail')
            if (thumbResult.error || !thumbResult.data) {
                failedCount++
                continue
            }

            // Create database record
            const recordResult = await createTreePhotoRecord({
                lotId,
                photoUrl: fullResult.data.url,
                thumbnailUrl: thumbResult.data.url,
                gps: photo.gps,
                capturedAt: photo.capturedAt,
                caption: photo.caption,
            })

            if (recordResult.error) {
                failedCount++
            } else {
                successCount++
            }
        }

        return {
            data: { successCount, failedCount },
            error: failedCount > 0 ? `${failedCount} photos failed to upload` : null,
        }
    } catch (error) {
        console.error('Batch upload error:', error)
        return { data: null, error: 'Batch upload failed' }
    }
}

/**
 * Get available lots for upload
 */
export async function getLotsForUpload(): Promise<{
    data: Array<{ id: string; name: string; region: string }> | null
    error: string | null
}> {
    try {
        const supabase = await createServerClient()

        const { data: lots, error } = await supabase
            .from('lots')
            .select('id, name, region')
            .order('name')

        if (error) {
            console.error('Fetch lots error:', error)
            return { data: null, error: error.message }
        }

        return { data: lots, error: null }
    } catch (error) {
        console.error('Get lots error:', error)
        return { data: null, error: 'Failed to fetch lots' }
    }
}
