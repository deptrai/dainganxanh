import { useState, useCallback } from 'react'

interface Toast {
    title: string
    description?: string
    variant?: 'default' | 'destructive'
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
        // Simple console log for now - can be enhanced with actual toast UI later
        const message = `[${variant.toUpperCase()}] ${title}${description ? `: ${description}` : ''}`

        if (variant === 'destructive') {
            console.error(message)
        } else {
            console.log(message)
        }

        // Store toast for potential UI rendering
        const newToast = { title, description, variant }
        setToasts(prev => [...prev, newToast])

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t !== newToast))
        }, 3000)
    }, [])

    return { toast, toasts }
}
