import { useState } from 'react'

interface ImageGalleryProps {
    images: string[]
    alt: string
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
    const [selected, setSelected] = useState(0)
    const validImages = Array.isArray(images) ? images : []

    if (validImages.length === 0) {
        return (
            <div className="aspect-[16/9] bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl flex items-center justify-center">
                <span className="text-6xl">🌳</span>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
                <img
                    src={validImages[selected]}
                    alt={`${alt} - Ảnh ${selected + 1}`}
                    className="w-full h-full object-cover"
                />
            </div>
            {validImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                    {validImages.slice(0, 4).map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelected(idx)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                                selected === idx ? 'border-emerald-500' : 'border-transparent hover:border-gray-300'
                            }`}
                        >
                            <img src={img} alt={`${alt} - Thu nhỏ ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
