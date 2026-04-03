'use client'

import { stopImpersonation } from '@/actions/impersonation'

interface ImpersonationBannerProps {
    userName: string | null | undefined
    adminRole?: string | null
}

export default function ImpersonationBanner({ userName, adminRole }: ImpersonationBannerProps) {
    const isSuperAdmin = adminRole === 'super_admin'
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
                <span className="text-amber-200 text-xs">
                    {isSuperAdmin ? '(Đang thao tác thay cho user)' : '(Chế độ xem — không thể thực hiện thao tác)'}
                </span>
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
