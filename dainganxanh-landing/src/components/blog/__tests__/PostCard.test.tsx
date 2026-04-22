/**
 * Component Tests: PostCard
 *
 * [P1] Public blog — card rendering, date formatting (vi locale), cover fallback, tag rendering.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { PostCard, type PostCardData } from '../PostCard'

// next/link passthrough
jest.mock('next/link', () => {
    return ({ children, href, ...rest }: any) => (
        <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a>
    )
})

// next/image passthrough — render plain <img>
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, ...rest }: any) => <img src={src} alt={alt} {...rest} />,
}))

const basePost: PostCardData = {
    id: 'post-1',
    title: 'Cây Dó Đen là gì?',
    slug: 'cay-do-den-la-gi',
    excerpt: 'Giới thiệu cây Dó Đen Việt Nam',
    cover_image: 'https://cdn.example.com/cover.jpg',
    published_at: '2026-04-15T10:00:00Z',
    tags: ['giới-thiệu', 'trồng-cây'],
}

describe('[P1] PostCard — rendering', () => {
    test('[P1] renders post title', () => {
        render(<PostCard post={basePost} />)
        expect(screen.getByRole('heading', { name: /cây dó đen là gì/i })).toBeInTheDocument()
    })

    test('[P1] renders excerpt when provided', () => {
        render(<PostCard post={basePost} />)
        expect(screen.getByText(/giới thiệu cây dó đen việt nam/i)).toBeInTheDocument()
    })

    test('[P1] does not render excerpt paragraph when null', () => {
        render(<PostCard post={{ ...basePost, excerpt: null }} />)
        expect(screen.queryByText(/giới thiệu cây dó đen/i)).not.toBeInTheDocument()
    })

    test('[P1] links to /blog/:slug', () => {
        render(<PostCard post={basePost} />)
        const anchors = screen.getAllByRole('link')
        expect(anchors.some((a) => a.getAttribute('href') === '/blog/cay-do-den-la-gi')).toBe(true)
    })

    test('[P1] renders cover image when provided', () => {
        render(<PostCard post={basePost} />)
        const img = screen.getByAltText(/cây dó đen là gì/i) as HTMLImageElement
        expect(img.src).toContain('cover.jpg')
    })

    test('[P1] shows emoji fallback when cover_image is null', () => {
        render(<PostCard post={{ ...basePost, cover_image: null }} />)
        expect(screen.getByText('🌿')).toBeInTheDocument()
    })

    test('[P1] formats published_at with Vietnamese locale', () => {
        render(<PostCard post={basePost} />)
        // April → "thg 4" or "Th04" depending on date-fns vi locale version; just assert year + day present
        expect(screen.getByText(/15/)).toBeInTheDocument()
        expect(screen.getByText(/2026/)).toBeInTheDocument()
    })
})
