'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { updateTreeHealth } from '@/actions/treeHealth'
import TreeHealthModal from '@/components/admin/TreeHealthModal'

interface Tree {
    id: string
    code: string
    health_status: 'healthy' | 'sick' | 'dead'
    status: string
    user_id: string
    created_at: string
}

interface Lot {
    id: string
    name: string
    region: string
}

export default function TreesPage() {
    const [lots, setLots] = useState<Lot[]>([])
    const [selectedLotId, setSelectedLotId] = useState<string>('')
    const [healthFilter, setHealthFilter] = useState<string>('all')
    const [trees, setTrees] = useState<Tree[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedTree, setSelectedTree] = useState<Tree | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [selectedTreeIds, setSelectedTreeIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchLots()
    }, [])

    useEffect(() => {
        if (selectedLotId) {
            fetchTrees()
            setSelectedTreeIds(new Set()) // Clear selection when lot changes
        }
    }, [selectedLotId, healthFilter])

    const fetchLots = async () => {
        try {
            const supabase = createBrowserClient()
            const { data, error } = await supabase
                .from('lots')
                .select('id, name, region')
                .order('name')

            if (error) throw error
            setLots(data || [])
            if (data && data.length > 0) {
                setSelectedLotId(data[0].id)
            }
        } catch (err) {
            console.error('Error fetching lots:', err)
        }
    }

    const fetchTrees = async () => {
        setLoading(true)
        try {
            const supabase = createBrowserClient()
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id')
                .eq('lot_id', selectedLotId)

            if (ordersError) throw ordersError

            const orderIds = orders?.map(o => o.id) || []
            if (orderIds.length === 0) {
                setTrees([])
                return
            }

            let query = supabase
                .from('trees')
                .select('*')
                .in('order_id', orderIds)
                .order('code')

            if (healthFilter !== 'all') {
                query = query.eq('health_status', healthFilter)
            }

            const { data, error } = await query
            if (error) throw error
            setTrees(data || [])
        } catch (err) {
            console.error('Error fetching trees:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedTreeIds(new Set(trees.map(t => t.id)))
        } else {
            setSelectedTreeIds(new Set())
        }
    }

    const handleSelectTree = (treeId: string, checked: boolean) => {
        const newSelected = new Set(selectedTreeIds)
        if (checked) {
            newSelected.add(treeId)
        } else {
            newSelected.delete(treeId)
        }
        setSelectedTreeIds(newSelected)
    }

    const handleBulkUpdate = async (newStatus: 'healthy' | 'sick' | 'dead') => {
        if (selectedTreeIds.size === 0) return

        const statusLabels = { healthy: 'Khỏe', sick: 'Bệnh', dead: 'Chết' }
        const confirmed = confirm(`Cập nhật ${selectedTreeIds.size} cây sang trạng thái "${statusLabels[newStatus]}"?`)
        if (!confirmed) return

        for (const treeId of selectedTreeIds) {
            await updateTreeHealth({
                treeId,
                newStatus,
                notes: `Bulk update to ${newStatus}`,
            })
        }

        setSelectedTreeIds(new Set())
        fetchTrees()
    }

    const stats = {
        total: trees.length,
        healthy: trees.filter(t => t.health_status === 'healthy').length,
        sick: trees.filter(t => t.health_status === 'sick').length,
        dead: trees.filter(t => t.health_status === 'dead').length,
    }

    const getStatusBadge = (status: string) => {
        const colors = {
            healthy: 'bg-green-100 text-green-800',
            sick: 'bg-yellow-100 text-yellow-800',
            dead: 'bg-red-100 text-red-800',
        }
        const labels = { healthy: 'Khỏe', sick: 'Bệnh', dead: 'Chết' }
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status as keyof typeof labels] || status}
            </span>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Tình trạng Cây</h1>
                <p className="mt-1 text-sm text-gray-600">Theo dõi và cập nhật tình trạng sức khỏe của từng cây</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn Lô</label>
                        <select
                            value={selectedLotId}
                            onChange={(e) => setSelectedLotId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            {lots.map((lot) => (
                                <option key={lot.id} value={lot.id}>{lot.name} - {lot.region}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo Tình trạng</label>
                        <select
                            value={healthFilter}
                            onChange={(e) => setHealthFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="all">Tất cả</option>
                            <option value="healthy">Khỏe</option>
                            <option value="sick">Bệnh</option>
                            <option value="dead">Chết</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">Tổng số cây</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
                    <div className="text-sm text-green-600">Cây khỏe</div>
                    <div className="text-2xl font-bold text-green-900 mt-1">{stats.healthy}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
                    <div className="text-sm text-yellow-600">Cây bệnh</div>
                    <div className="text-2xl font-bold text-yellow-900 mt-1">{stats.sick}</div>
                </div>
                <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
                    <div className="text-sm text-red-600">Cây chết</div>
                    <div className="text-2xl font-bold text-red-900 mt-1">{stats.dead}</div>
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedTreeIds.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                        Đã chọn {selectedTreeIds.size} cây
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBulkUpdate('healthy')}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                            Đánh dấu Khỏe
                        </button>
                        <button
                            onClick={() => handleBulkUpdate('sick')}
                            className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                        >
                            Đánh dấu Bệnh
                        </button>
                        <button
                            onClick={() => handleBulkUpdate('dead')}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                            Đánh dấu Chết
                        </button>
                        <button
                            onClick={() => setSelectedTreeIds(new Set())}
                            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                            Hủy chọn
                        </button>
                    </div>
                </div>
            )}

            {/* Trees Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="mt-2 text-gray-600">Đang tải...</p>
                    </div>
                ) : trees.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có cây nào</h3>
                        <p className="mt-1 text-sm text-gray-500">Chưa có cây nào trong lô này</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedTreeIds.size === trees.length && trees.length > 0}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã cây</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tình trạng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trees.map((tree) => (
                                <tr key={tree.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedTreeIds.has(tree.id)}
                                            onChange={(e) => handleSelectTree(tree.id, e.target.checked)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{tree.code}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(tree.health_status || 'healthy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-600">{tree.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(tree.created_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setSelectedTree(tree)
                                                setShowModal(true)
                                            }}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Cập nhật
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Health Update Modal */}
            {selectedTree && (
                <TreeHealthModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false)
                        setSelectedTree(null)
                    }}
                    treeId={selectedTree.id}
                    treeCode={selectedTree.code}
                    currentStatus={selectedTree.health_status || 'healthy'}
                    onSuccess={fetchTrees}
                />
            )}
        </div>
    )
}
