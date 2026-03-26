'use client'

import DOMPurify from 'isomorphic-dompurify'

interface PostContentProps {
  content: string
}

export function PostContent({ content }: PostContentProps) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'width', 'height', 'title'],
  })

  return (
    <div
      className="blog-prose"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
