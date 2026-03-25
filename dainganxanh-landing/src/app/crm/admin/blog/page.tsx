import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import DeletePostButton from './DeletePostButton'

export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  const supabase = await createServerClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, status, published_at, created_at, tags')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="mt-2 text-gray-600">Quản lý bài viết blog</p>
        </div>
        <Link
          href="/crm/admin/blog/new"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          + Tạo bài mới
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Lỗi tải dữ liệu: {error.message}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!posts || posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Chưa có bài viết nào.{' '}
            <Link href="/crm/admin/blog/new" className="text-green-600 hover:underline">
              Tạo bài đầu tiên
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Tiêu đề</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Publish lúc</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Tạo lúc</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-gray-900">{post.title}</span>
                      <div className="text-xs text-gray-400 font-mono">/blog/{post.slug}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('vi-VN')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === 'published' && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                        >
                          Xem
                        </Link>
                      )}
                      <Link
                        href={`/crm/admin/blog/${post.id}/edit`}
                        className="px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Sửa
                      </Link>
                      <DeletePostButton id={post.id} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    published: { label: 'Published', className: 'bg-green-100 text-green-800' },
    draft: { label: 'Draft', className: 'bg-yellow-100 text-yellow-800' },
    scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
  } as const

  const c = config[status as keyof typeof config] ?? { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  )
}
