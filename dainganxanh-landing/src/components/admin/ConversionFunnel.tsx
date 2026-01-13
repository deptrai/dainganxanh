'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ConversionFunnelProps {
    data: Array<{ stage: string; count: number; percentage: number }>
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']

export default function ConversionFunnel({ data }: ConversionFunnelProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Conversion Funnel</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    Chưa có dữ liệu
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Conversion Funnel</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                        dataKey="stage"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={100}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                        }}
                        formatter={(value: number, name: string, props: any) => {
                            const percentage = props.payload.percentage
                            return [`${value.toLocaleString('vi-VN')} (${percentage.toFixed(1)}%)`, 'Count']
                        }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
