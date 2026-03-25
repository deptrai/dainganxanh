import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagBadgeProps {
  tag: string
  active?: boolean
  asLink?: boolean
  className?: string
}

export function TagBadge({ tag, active, asLink = false, className }: TagBadgeProps) {
  const classes = cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
    active
      ? 'bg-emerald-600 text-white'
      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    className
  )

  if (asLink) {
    return (
      <Link href={`/blog?tag=${encodeURIComponent(tag)}`} className={classes}>
        {tag}
      </Link>
    )
  }

  return <span className={classes}>{tag}</span>
}
