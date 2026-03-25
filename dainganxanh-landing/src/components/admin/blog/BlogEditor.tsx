'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/utils/slug'
import { createPost, updatePost, uploadBlogImage } from '@/actions/blog'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  cover_image: string | null
  status: string
  tags: string[]
  meta_title: string | null
  meta_desc: string | null
}

interface BlogEditorProps {
  post?: Post
}

export default function BlogEditor({ post }: BlogEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form fields
  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!post?.slug)
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? '')
  const [tags, setTags] = useState<string[]>(post?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? '')
  const [metaDesc, setMetaDesc] = useState(post?.meta_desc ?? '')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Bắt đầu viết nội dung bài...' }),
    ],
    content: post?.content ?? '',
    immediatelyRender: false,
  })

  // Auto generate slug from title
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(generateSlug(title))
    }
  }, [title, slugManual])

  // ─── Toolbar actions ─────────────────────────────────────────────────────

  function handleInsertImageFromUrl() {
    const url = window.prompt('Nhập URL hình ảnh:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    setUploadingImage(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    const result = await uploadBlogImage(fd)
    setUploadingImage(false)

    if (!result.success || !result.url) {
      setError(result.error ?? 'Upload thất bại')
      return
    }

    editor.chain().focus().setImage({ src: result.url }).run()
  }

  async function handleCoverImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    const result = await uploadBlogImage(fd)
    setUploadingImage(false)

    if (!result.success || !result.url) {
      setError(result.error ?? 'Upload ảnh bìa thất bại')
      return
    }

    setCoverImage(result.url)
  }

  // ─── Tags ────────────────────────────────────────────────────────────────

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,/g, '')
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag])
      }
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  function buildFormData(status: string): FormData {
    const fd = new FormData()
    fd.append('title', title)
    fd.append('slug', slug)
    fd.append('content', editor?.getHTML() ?? '')
    fd.append('excerpt', excerpt)
    fd.append('cover_image', coverImage)
    fd.append('status', status)
    fd.append('tags', JSON.stringify(tags))
    fd.append('meta_title', metaTitle)
    fd.append('meta_desc', metaDesc)
    return fd
  }

  function handleSave(status: string) {
    setError(null)
    setSuccessMsg(null)

    startTransition(async () => {
      const fd = buildFormData(status)

      const result = post
        ? await updatePost(post.id, fd)
        : await createPost(fd)

      if (!result.success) {
        setError(result.error ?? 'Lỗi không xác định')
        return
      }

      setSuccessMsg(status === 'published' ? 'Đã publish bài viết!' : 'Đã lưu draft!')

      if (!post && 'id' in result) {
        router.push(`/crm/admin/blog/${result.id}/edit`)
      }
    })
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          {successMsg}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tiêu đề <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề bài viết..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slug <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugManual(true)
            }}
            placeholder="url-slug-bai-viet"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => {
              setSlug(generateSlug(title))
              setSlugManual(false)
            }}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Tự động
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">/blog/{slug || '...'}</p>
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nội dung <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
              title="Bold"
            >
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
              title="Italic"
            >
              <em>I</em>
            </ToolbarButton>
            <div className="w-px bg-gray-300 mx-1" />
            {([2, 3, 4] as const).map((level) => (
              <ToolbarButton
                key={level}
                onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
                active={editor?.isActive('heading', { level })}
                title={`Heading ${level}`}
              >
                H{level}
              </ToolbarButton>
            ))}
            <div className="w-px bg-gray-300 mx-1" />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              title="Danh sách"
            >
              •−
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              title="Danh sách số"
            >
              1.
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              active={editor?.isActive('blockquote')}
              title="Trích dẫn"
            >
              &ldquo;&rdquo;
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              active={editor?.isActive('codeBlock')}
              title="Code"
            >
              {'</>'}
            </ToolbarButton>
            <div className="w-px bg-gray-300 mx-1" />
            <ToolbarButton onClick={handleInsertImageFromUrl} title="Chèn ảnh từ URL">
              🖼 URL
            </ToolbarButton>
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
                {uploadingImage ? '...' : '🖼 Upload'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadImage}
                disabled={uploadingImage}
              />
            </label>
          </div>

          {/* Editor area */}
          <EditorContent
            editor={editor}
            className="min-h-[320px] p-4 prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]"
          />
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          placeholder="Mô tả ngắn về bài viết..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa</label>
        <div className="flex gap-2 items-start">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://... hoặc upload bên phải"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <span>{uploadingImage ? 'Đang upload...' : 'Upload ảnh bìa'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageUpload}
                disabled={uploadingImage}
                ref={fileInputRef}
              />
            </label>
          </div>
          {coverImage && (
            <img
              src={coverImage}
              alt="Cover preview"
              className="w-24 h-16 object-cover rounded border border-gray-200"
            />
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-green-600 hover:text-green-800 text-xs ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="Nhập tag rồi nhấn Enter hoặc dấu phẩy..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
      </div>

      {/* SEO */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">SEO (tùy chọn)</h3>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder={title || 'Meta title...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">{metaTitle.length}/60 ký tự</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
          <textarea
            value={metaDesc}
            onChange={(e) => setMetaDesc(e.target.value)}
            rows={2}
            placeholder={excerpt || 'Mô tả ngắn hiển thị trên Google...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{metaDesc.length}/160 ký tự</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSave('draft')}
          disabled={isPending}
          className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Đang lưu...' : 'Lưu Draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSave('published')}
          disabled={isPending}
          className="flex-1 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Đang xử lý...' : 'Publish ngay'}
        </button>
      </div>
    </div>
  )
}

// ─── Toolbar Button ──────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean | null
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-xs rounded border transition-colors ${
        active
          ? 'bg-green-600 text-white border-green-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}
