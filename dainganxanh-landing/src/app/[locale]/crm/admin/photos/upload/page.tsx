'use client'

import { useState, useEffect } from 'react'
import { PhotoUploader, type PhotoFile } from '@/components/admin/PhotoUploader'
import { GPSPreview } from '@/components/admin/GPSPreview'
import { processPhotoForUpload } from '@/lib/imageProcessing'
import {
    getLotsForUpload,
    batchUploadPhotos,
    uploadPhotoToStorage,
    createTreePhotoRecord,
} from '@/actions/photoUpload'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

export default function PhotoUploadPage() {
    const [lots, setLots] = useState<Array<{ id: string; name: string; region: string }>>([])
    const [selectedLotId, setSelectedLotId] = useState('')
    const [photos, setPhotos] = useState<PhotoFile[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<{
        type: 'success' | 'error' | null
        message: string
    }>({ type: null, message: '' })

    // Load lots on mount
    useEffect(() => {
        async function loadLots() {
            const result = await getLotsForUpload()
            if (result.data) {
                setLots(result.data)
                if (result.data.length > 0) {
                    setSelectedLotId(result.data[0].id)
                }
            }
        }
        loadLots()
    }, [])

    const handlePhotosSelected = async (newPhotos: PhotoFile[]) => {
        setIsProcessing(true)
        setUploadStatus({ type: null, message: '' })

        // Process each photo (extract EXIF, compress, generate thumbnail)
        const processedPhotos = await Promise.all(
            newPhotos.map(async (photo) => {
                try {
                    const processed = await processPhotoForUpload(photo.file)
                    return { ...photo, processed }
                } catch (error) {
                    console.error('Error processing photo:', error)
                    return { ...photo, error: 'Failed to process image' }
                }
            })
        )

        setPhotos([...photos, ...processedPhotos])
        setIsProcessing(false)
    }

    const handlePhotoRemove = (id: string) => {
        setPhotos(photos.filter((p) => p.id !== id))
        setUploadStatus({ type: null, message: '' })
    }

    const handleUpload = async () => {
        if (!selectedLotId) {
            setUploadStatus({ type: 'error', message: 'Vui lòng chọn lô' })
            return
        }

        if (photos.length === 0) {
            setUploadStatus({ type: 'error', message: 'Vui lòng chọn ảnh' })
            return
        }

        setIsUploading(true)
        setUploadStatus({ type: null, message: '' })

        try {
            let successCount = 0
            let failedCount = 0

            // Upload each photo individually to show progress
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i]
                if (!photo.processed) {
                    failedCount++
                    setPhotos((prev) =>
                        prev.map((p) =>
                            p.id === photo.id ? { ...p, error: 'Not processed' } : p
                        )
                    )
                    continue
                }

                // Mark as uploading
                setPhotos((prev) =>
                    prev.map((p) => (p.id === photo.id ? { ...p, uploading: true } : p))
                )

                try {
                    // Upload full image
                    const fullResult = await uploadPhotoToStorage(
                        photo.processed.compressed,
                        selectedLotId,
                        'full'
                    )

                    if (fullResult.error || !fullResult.data) {
                        throw new Error(fullResult.error || 'Upload failed')
                    }

                    // Upload thumbnail
                    const thumbResult = await uploadPhotoToStorage(
                        photo.processed.thumbnail,
                        selectedLotId,
                        'thumbnail'
                    )

                    if (thumbResult.error || !thumbResult.data) {
                        throw new Error(thumbResult.error || 'Thumbnail upload failed')
                    }

                    // Create database record
                    const recordResult = await createTreePhotoRecord({
                        lotId: selectedLotId,
                        photoUrl: fullResult.data.url,
                        thumbnailUrl: thumbResult.data.url,
                        gps: photo.processed.gps,
                        capturedAt: photo.processed.capturedAt,
                    })

                    if (recordResult.error) {
                        throw new Error(recordResult.error)
                    }

                    // Mark as uploaded
                    setPhotos((prev) =>
                        prev.map((p) =>
                            p.id === photo.id
                                ? { ...p, uploading: false, uploaded: true }
                                : p
                        )
                    )
                    successCount++
                } catch (error) {
                    console.error('Upload error:', error)
                    setPhotos((prev) =>
                        prev.map((p) =>
                            p.id === photo.id
                                ? {
                                    ...p,
                                    uploading: false,
                                    error: error instanceof Error ? error.message : 'Upload failed',
                                }
                                : p
                        )
                    )
                    failedCount++
                }
            }

            // Show final status
            if (failedCount === 0) {
                setUploadStatus({
                    type: 'success',
                    message: `✅ Đã upload thành công ${successCount} ảnh!`,
                })
                // Clear photos after 2 seconds
                setTimeout(() => {
                    setPhotos([])
                }, 2000)
            } else {
                setUploadStatus({
                    type: 'error',
                    message: `⚠️ Upload thành công ${successCount}/${photos.length} ảnh. ${failedCount} ảnh thất bại.`,
                })
            }
        } catch (error) {
            console.error('Upload error:', error)
            setUploadStatus({
                type: 'error',
                message: 'Có lỗi xảy ra khi upload ảnh',
            })
        } finally {
            setIsUploading(false)
        }
    }

    const selectedLot = lots.find((lot) => lot.id === selectedLotId)
    const canUpload = selectedLotId && photos.length > 0 && !isUploading && !isProcessing

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Ảnh Cây</h1>
                    <p className="text-gray-600">
                        Upload ảnh từ điện thoại với GPS tự động
                    </p>
                </div>

                {/* Lot Selector */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn Lô <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedLotId}
                        onChange={(e) => setSelectedLotId(e.target.value)}
                        disabled={isUploading}
                        className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {lots.map((lot) => (
                            <option key={lot.id} value={lot.id}>
                        {lot.name} - {lot.region}
                    </option>
                        ))}
                </select>
                {selectedLot && (
                    <p className="mt-2 text-sm text-gray-500">
                        Đã chọn: {selectedLot.name} ({selectedLot.region})
                    </p>
                )}
            </div>

            {/* Photo Uploader */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Chọn Ảnh
                </h2>
                <PhotoUploader
                    photos={photos}
                    onPhotosSelected={handlePhotosSelected}
                    onPhotoRemove={handlePhotoRemove}
                    disabled={isUploading || isProcessing}
                    maxFiles={20}
                />

                {isProcessing && (
                    <div className="mt-4 flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                        <span className="text-sm">Đang xử lý ảnh...</span>
                    </div>
                )}
            </div>

            {/* Upload Status */}
            {uploadStatus.type && (
                <div
                    className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${uploadStatus.type === 'success'
                            ? 'bg-green-50 text-green-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                >
                    {uploadStatus.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-medium">{uploadStatus.message}</p>
                </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleUpload}
                    disabled={!canUpload}
                    className={`
                            flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                            transition-colors duration-200
                            ${canUpload
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                        `}
                >
                    <Upload className="w-5 h-5" />
                    {isUploading ? 'Đang upload...' : `Upload ${photos.length} ảnh`}
                </button>
            </div>
        </div>
        </div >
    )
}
