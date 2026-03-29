'use client'

import { stopImpersonation } from '@/actions/impersonation'

interface ImpersonationBannerProps {
    userName: string | null | undefined
}

export default function ImpersonationBanner({ userName }: ImpersonationBannerProps) {
    const handleStop = async () => {
        await stopImpersonation()
        window.location.href = '/crm/admin/users'
    }

    return (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm font-medium z-50 sticky top-0">
            <div className="flex items-center gap-2">
                <span>👁️</span>
                <span>
                    Đang xem tài khoản: <strong>{userName || 'Unknown'}</strong>
                </span>
                <span className="text-amber-200 text-xs">(Chế độ xem — không thể thực hiện thao tác)</span>
            </div>
            <button
                onClick={handleStop}
                className="px-3 py-1 bg-white text-amber-700 rounded font-semibold hover:bg-amber-50 transition-colors text-xs"
            >
                Thoát ←
            </button>
        </div>
    )
}
