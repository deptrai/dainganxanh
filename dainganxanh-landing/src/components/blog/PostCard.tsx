import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { TagBadge } from './TagBadge'
import { Calendar } from 'lucide-react'

export interface PostCardData {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  cover_image?: string | null
  published_at?: string | null
  tags?: string[]
}

interface PostCardProps {
  post: PostCardData
  currentTag?: string
}

export function PostCard({ post, currentTag }: PostCardProps) {
  const publishedDate = post.published_at
    ? format(new Date(post.published_at), 'dd MMM yyyy', { locale: vi })
    : null

  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-emerald-100 hover:shadow-md transition-shadow flex flex-col">
      {/* Cover Image */}
      <Link href={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden bg-emerald-50">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
            <span className="text-4xl">🌿</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag} tag={tag} active={tag === currentTag} asLink />
            ))}
          </div>
        )}

        {/* Title */}
        <Link href={`/blog/${post.slug}`} className="group flex-1">
          <h2 className="text-base font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{post.excerpt}</p>
        )}

        {/* Footer */}
        {publishedDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-auto pt-3 border-t border-gray-100">
            <Calendar className="w-3.5 h-3.5" />
            <span>{publishedDate}</span>
          </div>
        )}
      </div>
    </article>
  )
}
