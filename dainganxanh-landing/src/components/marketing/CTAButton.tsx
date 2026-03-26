import Link from 'next/link'
import { ScaleHover } from '@/components/MotionWrapper'

interface CTAButtonProps {
    href?: string
    children?: React.ReactNode
    variant?: 'primary' | 'secondary'
    size?: 'default' | 'large'
    className?: string
}

export function CTAButton({
    href = '/pricing',
    children = 'Gieo Mầm Ngay',
    variant = 'primary',
    size = 'default',
    className = '',
}: CTAButtonProps) {
    const baseClasses = 'rounded-full font-bold transition-all inline-block text-center'
    const sizeClasses = size === 'large'
        ? 'text-xl px-12 py-5'
        : 'text-lg px-10 py-4'
    const variantClasses = variant === 'primary'
        ? 'bg-accent-gold hover:bg-yellow-400 text-brand-900 shadow-soft hover:shadow-lg ring-4 ring-accent-gold/30'
        : 'bg-white text-brand-900 hover:bg-brand-50 shadow-lg hover:shadow-white/20'

    return (
        <ScaleHover>
            <Link href={href} className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
                {children}
            </Link>
        </ScaleHover>
    )
}
