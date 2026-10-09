import { fetchAdminReferrals } from '@/actions/adminReferrals'

function formatVND(amount: number) {
    return amount.toLocaleString('vi-VN') + ' ₫'
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function AdminReferralsPage() {
    const { data, error } = await fetchAdminReferrals()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Hoa hồng giới thiệu</h1>
                <p className="mt-2 text-gray-600">Danh sách người dùng có hoa hồng từ giới thiệu</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">❌ {error}</p>
                </div>
            )}

            {data.length === 0 && !error ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    Chưa có hoa hồng nào
                </div>
            ) : (
                <div className="space-y-6">
                    {data.map((r) => (
                        <div key={r.user_id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                            {/* Referrer header */}
                            <div className="bg-green-50 border-b border-green-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-900 text-lg">
                                            {r.full_name || r.email}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-green-100 text-green-800">
                                            {r.referral_code}
                                        </span>
                                    </div>
                                    {r.full_name && (
                                        <p className="text-sm text-gray-500 mt-0.5">{r.email}</p>
                                    )}
                                </div>
                                <div className="flex gap-6 text-center">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Số đơn</p>
                                        <p className="text-xl font-bold text-gray-900">{r.total_orders}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Doanh số</p>
                                        <p className="text-xl font-bold text-gray-900">{formatVND(r.total_sales)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Hoa hồng (10%)</p>
                                        <p className="text-xl font-bold text-green-700">{formatVND(r.total_commission)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Đã rút</p>
                                        <p className="text-xl font-bold text-red-500">{formatVND(r.total_withdrawn)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Khả dụng</p>
                                        <p className={`text-xl font-bold ${r.available_balance > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                            {formatVND(r.available_balance)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Orders table */}
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Người mua</th>
                                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Số cây</th>
                                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hoa hồng</th>
                                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ngày</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {r.orders.map((o) => (
                                        <tr key={o.code} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm font-mono font-medium text-gray-900">{o.code}</td>
                                            <td className="px-6 py-3">
                                                <div className="text-sm font-medium text-gray-900">{o.buyer_name || '—'}</div>
                                                <div className="text-xs text-gray-500">{o.buyer_email}</div>
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm text-gray-900">{o.quantity} cây</td>
                                            <td className="px-6 py-3 text-right text-sm text-gray-900">{formatVND(o.total_amount)}</td>
                                            <td className="px-6 py-3 text-right text-sm font-semibold text-green-700">{formatVND(o.commission)}</td>
                                            <td className="px-6 py-3 text-right text-sm text-gray-500">{formatDate(o.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
