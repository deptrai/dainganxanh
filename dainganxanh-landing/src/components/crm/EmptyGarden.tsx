'use client'

import Link from 'next/link'

export default function EmptyGarden() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center max-w-md">
                {/* Illustration */}
                <div className="mb-6">
                    <span className="text-8xl">🌱</span>
                </div>

                {/* Message */}
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Bạn chưa có cây nào
                </h2>
                <p className="text-gray-600 mb-8">
                    Hãy bắt đầu hành trình xanh của bạn bằng cách trồng cây đầu tiên!
                </p>

                {/* CTA Button */}
                <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <span>🌳</span>
                    <span>Trồng cây ngay</span>
                </Link>

                {/* Additional Info */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl mb-1">🌍</div>
                        <div className="text-sm text-gray-600">Bảo vệ môi trường</div>
                    </div>
                    <div>
                        <div className="text-2xl mb-1">💰</div>
                        <div className="text-sm text-gray-600">Thu nhập bền vững</div>
                    </div>
                    <div>
                        <div className="text-2xl mb-1">📊</div>
                        <div className="text-sm text-gray-600">Theo dõi minh bạch</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
