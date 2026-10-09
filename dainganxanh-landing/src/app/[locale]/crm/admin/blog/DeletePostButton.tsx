'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletePost } from '@/actions/blog'

interface Props {
  id: string
  title: string
}

export default function DeletePostButton({ id, title }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    const confirmed = window.confirm(`Xóa bài viết "${title}"?\n\nHành động này không thể hoàn tác.`)
    if (!confirmed) return

    startTransition(async () => {
      const result = await deletePost(id)
      if (!result.success) {
        alert(`Lỗi khi xóa: ${result.error}`)
        return
      }
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'Đang xóa...' : 'Xóa'}
    </button>
  )
}
