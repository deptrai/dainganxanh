'use client'

import { useState } from 'react'
import { markOrderForPrint, resendContract, generateContract } from '@/actions/printQueue'

import { useToast } from '@/hooks/use-toast'
import { Printer, Mail, CheckCircle2, FileText, Loader2 } from 'lucide-react'

interface ContractActionsProps {
    orderId: string
    contractUrl?: string | null
    orderCode: string
    onSuccess?: () => void
}

export function ContractActions({
    orderId,
    contractUrl,
    orderCode,
    onSuccess,
}: ContractActionsProps) {
    const [isMarkingPrint, setIsMarkingPrint] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const { toast } = useToast()

    const handleMarkForPrint = async () => {
        setIsMarkingPrint(true)
        try {
            const result = await markOrderForPrint(orderId)

            if (result.success) {
                toast({
                    title: 'Thành công',
                    description: `Đơn hàng ${orderCode} đã được thêm vào hàng đợi in`,
                })
                onSuccess?.()
            } else {
                toast({
                    title: 'Lỗi',
                    description: result.error || 'Không thể thêm vào hàng đợi in',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Đã xảy ra lỗi khi thêm vào hàng đợi in',
                variant: 'destructive',
            })
        } finally {
            setIsMarkingPrint(false)
        }
    }

    const handleResendContract = async () => {
        setIsResending(true)
        try {
            const result = await resendContract(orderId)

            if (result.success) {
                toast({
                    title: 'Thành công',
                    description: `Email hợp đồng đã được gửi lại cho đơn hàng ${orderCode}`,
                })
                onSuccess?.()
            } else {
                toast({
                    title: 'Lỗi',
                    description: result.error || 'Không thể gửi lại email',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Đã xảy ra lỗi khi gửi email',
                variant: 'destructive',
            })
        } finally {
            setIsResending(false)
        }
    }

    const handleGenerateContract = async () => {
        setIsGenerating(true)
        try {
            const result = await generateContract(orderId)
            if (result.success) {
                toast({
                    title: 'Thành công',
                    description: `Hợp đồng đơn ${orderCode} đã được tạo. Tải lại trang để xem.`,
                })
                onSuccess?.()
            } else {
                toast({
                    title: 'Lỗi',
                    description: result.error || 'Không thể tạo hợp đồng',
                    variant: 'destructive',
                })
            }
        } catch {
            toast({ title: 'Lỗi', description: 'Đã xảy ra lỗi', variant: 'destructive' })
        } finally {
            setIsGenerating(false)
        }
    }

    if (!contractUrl) {
        return (
            <button
                onClick={handleGenerateContract}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:pointer-events-none h-9 px-3 transition-colors"
            >
                {isGenerating
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <FileText className="h-4 w-4" />
                }
                {isGenerating ? 'Đang tạo...' : 'Tạo hợp đồng'}
            </button>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleMarkForPrint}
                disabled={isMarkingPrint}
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
            >
                <Printer className="h-4 w-4" />
                {isMarkingPrint ? 'Đang xử lý...' : 'In hợp đồng'}
            </button>

            <button
                onClick={handleResendContract}
                disabled={isResending}
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
            >
                <Mail className="h-4 w-4" />
                {isResending ? 'Đang gửi...' : 'Gửi lại email'}
            </button>

            <a
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
            >
                <CheckCircle2 className="h-4 w-4" />
                Xem hợp đồng
            </a>
        </div>
    )
}
