export default function HarvestLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-8 animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 w-96 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-80 bg-gray-200 rounded"></div>
                </div>

                {/* Tree Summary Card Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-4 border-yellow-400 animate-pulse">
                    <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Harvest Options Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
                    <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="border-2 border-gray-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                    <div className="h-6 w-64 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-4 w-full bg-gray-200 rounded mb-4"></div>
                                <div className="h-8 w-40 bg-gray-200 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
