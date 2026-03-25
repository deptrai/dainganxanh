import Link from 'next/link'
import { PostCard, type PostCardData } from './PostCard'
import { TagBadge } from './TagBadge'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PostListProps {
  posts: PostCardData[]
  currentTag?: string
  allTags?: string[]
  page: number
  totalPages: number
}

export function PostList({ posts, currentTag, allTags, page, totalPages }: PostListProps) {
  const buildUrl = (p: number, tag?: string) => {
    const params = new URLSearchParams()
    if (tag) params.set('tag', tag)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/blog${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      {/* Tag Filter Bar */}
      {allTags && allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/blog"
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !currentTag
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            Tất cả
          </Link>
          {allTags.map((tag) => (
            <TagBadge key={tag} tag={tag} active={tag === currentTag} asLink />
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentTag={currentTag} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          {page > 1 ? (
            <Link
              href={buildUrl(page - 1, currentTag)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-100 text-gray-300 text-sm cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
              Trước
            </span>
          )}

          <span className="text-sm text-gray-500">
            Trang {page} / {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={buildUrl(page + 1, currentTag)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors text-sm"
            >
              Tiếp
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-100 text-gray-300 text-sm cursor-not-allowed">
              Tiếp
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
