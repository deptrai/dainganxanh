'use client'

import { useState } from 'react'
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react'
import type { ProcessedPhoto } from '@/lib/imageProcessing'

export interface PhotoFile {
    id: string
    file: File
    preview: string
    processed?: ProcessedPhoto
    uploading?: boolean
    uploaded?: boolean
    error?: string
}

interface PhotoUploaderProps {
    onPhotosSelected: (files: PhotoFile[]) => void
    onPhotoRemove: (id: string) => void
    photos: PhotoFile[]
    maxFiles?: number
    disabled?: boolean
}

export function PhotoUploader({
    onPhotosSelected,
    onPhotoRemove,
    photos,
    maxFiles = 10,
    disabled = false,
}: PhotoUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)

    const handleFileSelect = (files: FileList | null) => {
        if (!files || disabled) return

        const newPhotos: PhotoFile[] = Array.from(files)
            .filter((file) => file.type.startsWith('image/'))
            .slice(0, maxFiles - photos.length)
            .map((file) => ({
                id: `${Date.now()}-${Math.random()}`,
                file,
                preview: URL.createObjectURL(file),
            }))

        onPhotosSelected(newPhotos)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFileSelect(e.dataTransfer.files)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files)
        e.target.value = '' // Reset input
    }

    const canAddMore = photos.length < maxFiles

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            {canAddMore && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        relative border-2 border-dashed rounded-lg p-8
                        transition-colors duration-200
                        ${isDragging
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-green-400'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleInputChange}
                        disabled={disabled}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Upload photos"
                    />

                    <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                            Chọn ảnh hoặc kéo thả vào đây
                        </p>
                        <p className="text-sm text-gray-500">
                            Tối đa {maxFiles} ảnh ({photos.length}/{maxFiles})
                        </p>
                    </div>
                </div>
            )}

            {/* Photo Grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                        >
                            {/* Preview Image */}
                            <img
                                src={photo.preview}
                                alt={photo.file.name}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity">
                                {/* Remove Button */}
                                {!photo.uploading && !photo.uploaded && (
                                    <button
                                        onClick={() => onPhotoRemove(photo.id)}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        aria-label="Remove photo"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Status Indicators */}
                            {photo.uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                                </div>
                            )}

                            {photo.uploaded && (
                                <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            )}

                            {photo.error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-90">
                                    <div className="text-center p-2">
                                        <AlertCircle className="w-6 h-6 text-white mx-auto mb-1" />
                                        <p className="text-xs text-white">{photo.error}</p>
                                    </div>
                                </div>
                            )}

                            {/* GPS Indicator */}
                            {photo.processed?.gps && (
                                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                    GPS ✓
                                </div>
                            )}

                            {/* File Info */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                <p className="text-xs text-white truncate">{photo.file.name}</p>
                                <p className="text-xs text-gray-300">
                                    {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {photos.length === 0 && !canAddMore && (
                <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có ảnh nào</p>
                </div>
            )}
        </div>
    )
}
