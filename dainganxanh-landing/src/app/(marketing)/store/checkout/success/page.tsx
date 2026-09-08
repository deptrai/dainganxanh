import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { CheckCircle2, Package, Truck, Phone } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Đặt hàng thành công — Cửa Hàng Trầm Hương',
  description: 'Xác nhận đơn hàng trầm hương của bạn.',
}

export default async function StoreSuccessPage({ searchParams }: { searchParams: Promise<{ code?: string; total?: string }> }) {
  const { code, total } = await searchParams
  if (!code) notFound()

  const supabase = createServiceRoleClient()
  const { data: order } = await supabase
    .from('store_orders')
    .select('id, code, status, customer_name, total_amount, payment_method, created_at')
    .eq('code', code)
    .maybeSingle()

  if (!order) notFound()

  const amount = parseInt(total || String(order.total_amount), 10)

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {order.payment_method === 'cod' ? 'Đặt hàng thành công!' : 'Thanh toán thành công!'}
        </h1>
        <p className="text-gray-600 mb-6">
          Cảm ơn <span className="font-semibold text-gray-900">{order.customer_name}</span> đã tin tưởng Đại Ngàn Xanh.
        </p>

        <div className="bg-stone-100 rounded-xl p-4 text-left space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Mã đơn hàng</span>
            <span className="font-mono font-bold text-emerald-700">{order.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tổng tiền</span>
            <span className="font-bold text-gray-900">{amount.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Phương thức</span>
            <span className="font-medium text-gray-900">{order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Trạng thái</span>
            <span className="font-medium text-emerald-700 capitalize">{order.status}</span>
          </div>
        </div>

        <div className="space-y-3 text-left text-sm text-gray-600 mb-8">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Đơn hàng sẽ được chuẩn bị và giao trong 1-3 ngày làm việc.</span>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Chúng tôi sẽ cập nhật mã vận đơn khi giao cho đơn vị vận chuyển.</span>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Liên hệ hotline nếu cần hỗ trợ: <strong>0909 888 999</strong></span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/store"
            className="flex-1 py-3 border border-emerald-600 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
          <Link
            href="/crm/my-store-orders"
            className="flex-1 py-3 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors"
          >
            Xem đơn hàng
          </Link>
        </div>
      </div>
    </div>
  )
}
