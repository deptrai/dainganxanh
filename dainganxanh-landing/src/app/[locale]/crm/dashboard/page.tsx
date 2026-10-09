export default function DashboardPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    🌳 Dashboard
                </h1>
                <p className="text-gray-600 mb-8">
                    Trang dashboard đang được phát triển
                </p>
                <a
                    href="/crm/my-garden"
                    className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    Quay lại Vườn Cây
                </a>
            </div>
        </div>
    )
}
