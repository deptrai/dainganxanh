export type StoreOrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export const STORE_ORDER_STATUS_CONFIG: Record<
  StoreOrderStatus,
  { label: string; className: string }
> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-emerald-100 text-emerald-800' },
  processing: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Đang giao', className: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Đã giao', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
}
