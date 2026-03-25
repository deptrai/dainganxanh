'use client'

interface PostContentProps {
  content: string
}

/**
 * Renders HTML content from the Tiptap editor.
 * Content is trusted (admin-only input), so dangerouslySetInnerHTML is safe here.
 * Styled with Tailwind Typography-compatible prose classes via custom CSS.
 */
export function PostContent({ content }: PostContentProps) {
  return (
    <div
      className="blog-prose"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
