'use client'

import { useState, useEffect, useTransition } from 'react'
import {
    fetchPhantomUsers,
    togglePhantomUser,
    searchUsersForPhantom,
    createPhantomOrder,
    fetchPhantomOrders,
    deletePhantomOrder,
} from '@/actions/adminPhantomOrders'

export default function PhantomPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Phantom Orders</h1>
            <PhantomUsersSection />
            <CreatePhantomOrderSection />
            <PhantomOrdersSection />
        </div>
    )
}

function PhantomUsersSection() {
    const [phantomUsers, setPhantomUsers] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        loadPhantomUsers()
    }, [])

    async function loadPhantomUsers() {
        const { users } = await fetchPhantomUsers()
        setPhantomUsers(users)
    }

    async function handleSearch() {
        if (!searchTerm.trim()) return
        const { users } = await searchUsersForPhantom(searchTerm.trim())
        setSearchResults(users)
    }

    async function handleToggle(userId: string, isPhantom: boolean) {
        startTransition(async () => {
            const result = await togglePhantomUser(userId, isPhantom)
            if (result.error) {
                alert(result.error)
                return
            }
            await loadPhantomUsers()
            if (searchResults.length > 0) {
                const { users } = await searchUsersForPhantom(searchTerm.trim())
                setSearchResults(users)
            }
        })
    }

    return (
        <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Phantom Users</h2>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Tìm user (email, phone)..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                >
                    Tìm
                </button>
            </div>

            {searchResults.length > 0 && (
                <div className="mb-4 border border-gray-100 rounded-lg overflow-hidden">
                    <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50">Kết quả tìm kiếm</p>
                    {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                            <div className="text-sm">
                                <span className="text-gray-700">{user.email}</span>
                                {user.phone && <span className="text-gray-400 ml-2">{user.phone}</span>}
                            </div>
                            <button
                                onClick={() => handleToggle(user.id, !user.is_phantom)}
                                disabled={isPending}
                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    user.is_phantom
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                            >
                                {user.is_phantom ? 'Bỏ phantom' : 'Set phantom'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {phantomUsers.length > 0 ? (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50">
                        Phantom users ({phantomUsers.length})
                    </p>
                    {phantomUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                            <div className="text-sm">
                                <span className="text-gray-700">{user.email}</span>
                                {user.referral_code && (
                                    <span className="text-gray-400 ml-2 text-xs">({user.referral_code})</span>
                                )}
                            </div>
                            <button
                                onClick={() => handleToggle(user.id, false)}
                                disabled={isPending}
                                className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 font-medium"
                            >
                                Bỏ phantom
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500">Chưa có phantom user nào.</p>
            )}
        </section>
    )
}

function CreatePhantomOrderSection() {
    const [phantomUsers, setPhantomUsers] = useState<any[]>([])
    const [selectedUserId, setSelectedUserId] = useState('')
    const [userName, setUserName] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        fetchPhantomUsers().then(({ users }) => setPhantomUsers(users))
    }, [])

    function handleSubmit() {
        if (!selectedUserId || !userName.trim() || quantity < 1) return
        startTransition(async () => {
            const result = await createPhantomOrder({
                phantomUserId: selectedUserId,
                quantity,
                userName: userName.trim(),
            })
            if (result.error) {
                alert(result.error)
                return
            }
            setUserName('')
            setQuantity(1)
            alert('Tạo phantom order thành công!')
            window.dispatchEvent(new Event('phantom-order-created'))
        })
    }

    return (
        <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Tạo Phantom Order</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Phantom User</label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">Chọn user...</option>
                        {phantomUsers.map((u) => (
                            <option key={u.id} value={u.id}>{u.email}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Tên người mua</label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Số cây</label>
                    <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleSubmit}
                        disabled={isPending || !selectedUserId || !userName.trim()}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                        {isPending ? 'Đang tạo...' : 'Tạo đơn'}
                    </button>
                </div>
            </div>
        </section>
    )
}

function PhantomOrdersSection() {
    const [orders, setOrders] = useState<any[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [page, setPage] = useState(1)
    const [isPending, startTransition] = useTransition()
    const pageSize = 20

    useEffect(() => {
        loadOrders()
        const handler = () => loadOrders()
        window.addEventListener('phantom-order-created', handler)
        return () => window.removeEventListener('phantom-order-created', handler)
    }, [page])

    async function loadOrders() {
        const result = await fetchPhantomOrders(page, pageSize)
        if (!result.error) {
            setOrders(result.orders)
            setTotalCount(result.totalCount)
        }
    }

    async function handleDelete(orderId: string) {
        if (!confirm('Xóa phantom order này?')) return
        startTransition(async () => {
            const result = await deletePhantomOrder(orderId)
            if (result.error) {
                alert(result.error)
                return
            }
            await loadOrders()
        })
    }

    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">
                Phantom Orders ({totalCount})
            </h2>

            {orders.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có phantom order nào.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-gray-500">
                                    <th className="py-2 pr-4">Mã đơn</th>
                                    <th className="py-2 pr-4">Tên</th>
                                    <th className="py-2 pr-4">Email</th>
                                    <th className="py-2 pr-4">Số cây</th>
                                    <th className="py-2 pr-4">Ngày tạo</th>
                                    <th className="py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b border-gray-100">
                                        <td className="py-2 pr-4 font-mono text-xs">{order.code}</td>
                                        <td className="py-2 pr-4">{order.user_name}</td>
                                        <td className="py-2 pr-4 text-gray-500">{order.user_email}</td>
                                        <td className="py-2 pr-4">{order.quantity}</td>
                                        <td className="py-2 pr-4 text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="py-2 text-right">
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                disabled={isPending}
                                                className="text-xs text-red-600 hover:text-red-800"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                                ←
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-500">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                                →
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    )
}
