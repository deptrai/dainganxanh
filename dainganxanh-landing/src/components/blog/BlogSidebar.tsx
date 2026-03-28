import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar, TreePine } from 'lucide-react'
import { TagBadge } from './TagBadge'

export interface SidebarPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  cover_image?: string | null
  published_at?: string | null
  tags?: string[]
}

interface BlogSidebarProps {
  posts: SidebarPost[]
  currentSlug: string
}

export function BlogSidebar({ posts, currentSlug }: BlogSidebarProps) {
  const otherPosts = posts.filter((p) => p.slug !== currentSlug)

  return (
    <aside className="space-y-6">
      {/* Recent Posts */}
      {otherPosts.length > 0 && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Bài viết khác</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {otherPosts.map((post) => {
              const date = post.published_at
                ? format(new Date(post.published_at), 'dd MMM yyyy', { locale: vi })
                : null
              return (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex gap-3 p-4 hover:bg-emerald-50 transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-emerald-100">
                      {post.cover_image ? (
                        <Image
                          src={post.cover_image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="64px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl">🌿</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-700 line-clamp-2 transition-colors">
                        {post.title}
                      </p>
                      {date && (
                        <p className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {date}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Tags cloud — collect all unique tags */}
      {(() => {
        const allTags = [...new Set(otherPosts.flatMap((p) => p.tags ?? []))]
        if (allTags.length === 0) return null
        return (
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Chủ đề</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <TagBadge key={tag} tag={tag} asLink />
              ))}
            </div>
          </div>
        )
      })()}

      {/* CTA */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <TreePine className="w-5 h-5" />
          <span className="font-semibold text-sm">Trồng cây ngay hôm nay</span>
        </div>
        <p className="text-emerald-100 text-xs leading-relaxed mb-4">
          Sở hữu cây Dó Đen Việt — loài cây quý mang giá trị kinh tế và môi trường bền vững.
        </p>
        <Link
          href="/pricing"
          className="block text-center bg-white text-emerald-700 font-semibold text-sm py-2 rounded-xl hover:bg-emerald-50 transition-colors"
        >
          Xem gói trồng cây
        </Link>
      </div>
    </aside>
  )
}
