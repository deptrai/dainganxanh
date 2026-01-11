'use client'

import Image from 'next/image'

interface PhotoGalleryProps {
    orderId: string
    latestPhotoUrl: string | null
    ageInMonths: number
}

export default function PhotoGallery({ orderId, latestPhotoUrl, ageInMonths }: PhotoGalleryProps) {
    // For MVP: Show placeholder or latest photo only
    // TODO: Fetch multiple photos from lot when photo system is implemented

    const showPlaceholder = !latestPhotoUrl || ageInMonths < 9

    return (
        <div id="photos" className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📸</span>
                <h2 className="text-2xl font-bold text-gray-800">Thư Viện Ảnh</h2>
            </div>

            {showPlaceholder ? (
                <div className="h-96 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <span className="text-8xl mb-4 block">🌱</span>
                        <p className="text-xl text-gray-700 font-medium">Cây đang được ươm...</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Ảnh thực tế sẽ có sau 9 tháng
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Latest Photo */}
                    <div className="relative h-64 rounded-lg overflow-hidden group cursor-pointer">
                        <Image
                            src={latestPhotoUrl}
                            alt="Latest photo"
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <p className="text-white text-sm font-medium">Ảnh mới nhất</p>
                        </div>
                    </div>

                    {/* Placeholder for more photos */}
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <span className="text-4xl block mb-2">📷</span>
                            <p className="text-sm">Thêm ảnh sắp có</p>
                        </div>
                    </div>

                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <span className="text-4xl block mb-2">📷</span>
                            <p className="text-sm">Thêm ảnh sắp có</p>
                        </div>
                    </div>
                </div>
            )}

            <p className="text-sm text-gray-500 mt-4 text-center">
                Ảnh được cập nhật định kỳ mỗi quý
            </p>
        </div>
    )
}
