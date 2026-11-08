import { Link } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import BlogEditor from '@/components/admin/blog/BlogEditor'

interface NewBlogPostPageProps {
  params: Promise<{ locale: string }>
}

export default async function NewBlogPostPage({ params }: NewBlogPostPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/crm/admin/blog"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Danh sách bài viết
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tạo bài viết mới</h1>
        <p className="mt-2 text-gray-600">Điền thông tin và nội dung bài viết</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <BlogEditor />
      </div>
    </div>
  )
}
