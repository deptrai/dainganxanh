/**
 * Component Tests: BlogSidebar
 *
 * [P2] Public blog — filters out current post, renders recent posts + tag cloud + CTA.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { BlogSidebar, type SidebarPost } from '../BlogSidebar'

jest.mock('next/link', () => {
    return ({ children, href, ...rest }: any) => (
        <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a>
    )
})

jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, ...rest }: any) => <img src={src} alt={alt} {...rest} />,
}))

const make = (i: number, over: Partial<SidebarPost> = {}): SidebarPost => ({
    id: `s-${i}`,
    title: `Sidebar post ${i}`,
    slug: `sidebar-${i}`,
    excerpt: null,
    cover_image: null,
    published_at: '2026-04-10T00:00:00Z',
    tags: [],
    ...over,
})

describe('[P2] BlogSidebar — filtering', () => {
    test('[P2] excludes post matching currentSlug', () => {
        const posts = [make(1, { slug: 'current' }), make(2, { slug: 'other' })]
        render(<BlogSidebar posts={posts} currentSlug="current" />)
        expect(screen.queryByText(/sidebar post 1/i)).not.toBeInTheDocument()
        expect(screen.getByText(/sidebar post 2/i)).toBeInTheDocument()
    })

    test('[P2] renders nothing for recent posts when only the current post is in list', () => {
        render(<BlogSidebar posts={[make(1, { slug: 'current' })]} currentSlug="current" />)
        expect(screen.queryByText(/bài viết khác/i)).not.toBeInTheDocument()
    })

    test('[P2] shows "Bài viết khác" heading when other posts exist', () => {
        render(<BlogSidebar posts={[make(1), make(2)]} currentSlug="none" />)
        expect(screen.getByText(/bài viết khác/i)).toBeInTheDocument()
    })
})

describe('[P2] BlogSidebar — content', () => {
    test('[P2] links each recent post to /blog/:slug', () => {
        render(<BlogSidebar posts={[make(1, { slug: 'abc' })]} currentSlug="x" />)
        const link = screen.getAllByRole('link').find((l) => l.getAttribute('href') === '/blog/abc')
        expect(link).toBeDefined()
    })

    test('[P2] shows emoji fallback when post has no cover_image', () => {
        render(<BlogSidebar posts={[make(1, { cover_image: null })]} currentSlug="x" />)
        expect(screen.getAllByText('🌿').length).toBeGreaterThan(0)
    })

    test('[P2] renders tag cloud with deduplicated tags', () => {
        const posts = [
            make(1, { tags: ['tag-a', 'tag-b'] }),
            make(2, { tags: ['tag-b', 'tag-c'] }),
        ]
        render(<BlogSidebar posts={posts} currentSlug="none" />)
        expect(screen.getByText(/chủ đề/i)).toBeInTheDocument()
        // 3 unique tags — each appears once
        expect(screen.getAllByText(/tag-b/i)).toHaveLength(1)
    })

    test('[P2] renders CTA link to /pricing', () => {
        render(<BlogSidebar posts={[make(1)]} currentSlug="x" />)
        const cta = screen.getByRole('link', { name: /xem gói trồng cây/i })
        expect(cta.getAttribute('href')).toBe('/pricing')
    })
})
