'use client'

import { useEffect, useState } from 'react'
import { getPrintQueue, updatePrintStatus } from '@/actions/printQueue'

import { useToast } from '@/hooks/use-toast'
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react'

interface PrintQueueItem {
    id: string
    order_id: string
    status: 'pending' | 'printed' | 'shipped'
    printed_at: string | null
    shipped_at: string | null
    tracking_number: string | null
    created_at: string
    orders: {
        order_code: string
        quantity: number
        total_amount: number
        contract_url: string
        users: {
            full_name: string
            email: string
        }
    }
}

export default function PrintQueuePage() {
    const [queue, setQueue] = useState<PrintQueueItem[]>([])
    const [loading, setLoading] = useState(true)
    const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({})
    const { toast } = useToast()

    const loadQueue = async () => {
        setLoading(true)
        const result = await getPrintQueue()
        if (result.success) {
            setQueue(result.data as PrintQueueItem[])
        } else {
            toast({
                title: 'Lỗi',
                description: result.error || 'Không thể tải hàng đợi in',
                variant: 'destructive',
            })
        }
        setLoading(false)
    }

    useEffect(() => {
        loadQueue()
    }, [])

    const handleUpdateStatus = async (
        queueId: string,
        status: 'pending' | 'printed' | 'shipped',
        trackingNumber?: string
    ) => {
        const result = await updatePrintStatus(queueId, status, trackingNumber)

        if (result.success) {
            toast({
                title: 'Thành công',
                description: 'Đã cập nhật trạng thái',
            })
            loadQueue()
        } else {
            toast({
                title: 'Lỗi',
                description: result.error || 'Không thể cập nhật trạng thái',
                variant: 'destructive',
            })
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                        <Clock className="h-4 w-4" />
                        Chờ in
                    </span>
                )
            case 'printed':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                        <Package className="h-4 w-4" />
                        Đã in
                    </span>
                )
            case 'shipped':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                        <Truck className="h-4 w-4" />
                        Đã gửi
                    </span>
                )
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-muted-foreground">Đang tải...</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Hàng Đợi In Hợp Đồng</h1>
                <p className="text-muted-foreground">
                    Quản lý in và gửi hợp đồng vật lý qua bưu điện
                </p>
            </div>

            <div className="rounded-lg border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium">
                                    Mã đơn
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium">
                                    Khách hàng
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium">
                                    Số lượng
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium">
                                    Mã vận đơn
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {queue.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        Không có đơn hàng trong hàng đợi
                                    </td>
                                </tr>
                            ) : (
                                queue.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{item.orders.order_code}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{item.orders.users.full_name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {item.orders.users.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{item.orders.quantity} cây</td>
                                        <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                                        <td className="px-4 py-3">
                                            {item.status === 'printed' && (
                                                <input
                                                    placeholder="Nhập mã vận đơn"
                                                    value={trackingNumbers[item.id] || ''}
                                                    onChange={(e) =>
                                                        setTrackingNumbers({
                                                            ...trackingNumbers,
                                                            [item.id]: e.target.value,
                                                        })
                                                    }
                                                    className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            )}
                                            {item.tracking_number && (
                                                <span className="font-mono text-sm">
                                                    {item.tracking_number}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {item.status === 'pending' && (
                                                    <button
                                                        onClick={() =>
                                                            handleUpdateStatus(item.id, 'printed')
                                                        }
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                                    >
                                                        <CheckCircle2 className="mr-1 h-4 w-4" />
                                                        Đã in
                                                    </button>
                                                )}
                                                {item.status === 'printed' && (
                                                    <button
                                                        onClick={() =>
                                                            handleUpdateStatus(
                                                                item.id,
                                                                'shipped',
                                                                trackingNumbers[item.id]
                                                            )
                                                        }
                                                        disabled={!trackingNumbers[item.id]}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 bg-black text-white"
                                                    >
                                                        <Truck className="mr-1 h-4 w-4" />
                                                        Đã gửi
                                                    </button>
                                                )}
                                                <a
                                                    href={item.orders.contract_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline inline-flex items-center"
                                                >
                                                    Xem PDF
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
