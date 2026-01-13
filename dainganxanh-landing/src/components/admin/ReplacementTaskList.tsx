'use client'

import { useState, useEffect } from 'react'
import { getReplacementTasks, updateReplacementTask } from '@/actions/treeHealth'

interface ReplacementTask {
    id: string
    deadTreeId: string
    newTreeId: string | null
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
    assignedTo: string | null
    notes: string | null
    reason: string | null
    createdAt: string
    completedAt: string | null
}

export default function ReplacementTaskList() {
    const [tasks, setTasks] = useState<ReplacementTask[]>([])
    const [statusFilter, setStatusFilter] = useState<string>('pending')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchTasks()
    }, [statusFilter])

    const fetchTasks = async () => {
        setLoading(true)
        setError(null)

        try {
            const result = await getReplacementTasks(statusFilter)

            if (result.error) {
                setError(result.error)
            } else {
                setTasks(result.data || [])
            }
        } catch (err) {
            console.error('Error fetching tasks:', err)
            setError('Không thể tải danh sách task')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (taskId: string, newStatus: string) => {
        try {
            const result = await updateReplacementTask(taskId, { status: newStatus as any })

            if (result.error) {
                alert(result.error)
            } else {
                fetchTasks() // Refresh list
            }
        } catch (err) {
            console.error('Error updating task:', err)
            alert('Không thể cập nhật task')
        }
    }

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            assigned: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-gray-100 text-gray-800',
        }
        const labels: Record<string, string> = {
            pending: 'Chờ xử lý',
            assigned: 'Đã gán',
            in_progress: 'Đang thực hiện',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
        }
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Task Trồng Cây Thay Thế</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Quản lý các task trồng cây thay thế cho cây đã chết
                    </p>
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="assigned">Đã gán</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-gray-600">Đang tải...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Không có task nào
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Chưa có task trồng cây thay thế
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Task ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nguyên nhân
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-mono text-gray-900">
                                            {task.id.substring(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {task.reason || 'Không rõ'}
                                        </div>
                                        {task.notes && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {task.notes}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(task.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(task.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {task.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Bắt đầu
                                            </button>
                                        )}
                                        {task.status === 'in_progress' && (
                                            <button
                                                onClick={() => handleStatusUpdate(task.id, 'completed')}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                            >
                                                Hoàn thành
                                            </button>
                                        )}
                                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Hủy
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
