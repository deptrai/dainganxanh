/**
 * Component Tests: PostList
 *
 * [P1] Public blog listing — tag filter bar, pagination URL building, post cards grid.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { PostList } from '../PostList'
import type { PostCardData } from '../PostCard'

jest.mock('next/link', () => {
    return ({ children, href, ...rest }: any) => (
        <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a>
    )
})

jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, ...rest }: any) => <img src={src} alt={alt} {...rest} />,
}))

const makePost = (i: number, over: Partial<PostCardData> = {}): PostCardData => ({
    id: `p-${i}`,
    title: `Bài viết ${i}`,
    slug: `bai-viet-${i}`,
    excerpt: `Tóm tắt ${i}`,
    cover_image: null,
    published_at: '2026-04-10T00:00:00Z',
    tags: ['news'],
    ...over,
})

describe('[P1] PostList — rendering', () => {
    test('[P1] renders all post cards', () => {
        const posts = [makePost(1), makePost(2), makePost(3)]
        render(<PostList posts={posts} page={1} totalPages={1} />)
        expect(screen.getByRole('heading', { name: /bài viết 1/i })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /bài viết 2/i })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /bài viết 3/i })).toBeInTheDocument()
    })

    test('[P1] shows tag filter bar with "Tất cả" when allTags provided', () => {
        render(<PostList posts={[makePost(1)]} page={1} totalPages={1} allTags={['tag-a', 'tag-b']} />)
        expect(screen.getByRole('link', { name: /tất cả/i })).toBeInTheDocument()
    })

    test('[P1] "Tất cả" link is active when no currentTag', () => {
        render(<PostList posts={[makePost(1)]} page={1} totalPages={1} allTags={['tag-a']} />)
        const link = screen.getByRole('link', { name: /tất cả/i })
        expect(link.className).toMatch(/bg-emerald-600/)
    })

    test('[P1] does not render tag filter bar when allTags is empty', () => {
        render(<PostList posts={[makePost(1)]} page={1} totalPages={1} allTags={[]} />)
        expect(screen.queryByRole('link', { name: /tất cả/i })).not.toBeInTheDocument()
    })
})

describe('[P1] PostList — pagination', () => {
    test('[P1] does not render pagination when totalPages is 1', () => {
        render(<PostList posts={[makePost(1)]} page={1} totalPages={1} />)
        expect(screen.queryByText(/trang 1/i)).not.toBeInTheDocument()
    })

    test('[P1] renders current page indicator', () => {
        render(<PostList posts={[makePost(1)]} page={2} totalPages={5} />)
        expect(screen.getByText(/trang 2 \/ 5/i)).toBeInTheDocument()
    })

    test('[P1] previous link points to previous page with correct URL', () => {
        render(<PostList posts={[makePost(1)]} page={3} totalPages={5} />)
        const prev = screen.getByRole('link', { name: /trước/i })
        expect(prev.getAttribute('href')).toBe('/blog?page=2')
    })

    test('[P1] previous link omits page=1 query string', () => {
        render(<PostList posts={[makePost(1)]} page={2} totalPages={5} />)
        const prev = screen.getByRole('link', { name: /trước/i })
        expect(prev.getAttribute('href')).toBe('/blog')
    })

    test('[P1] next link includes current tag in URL', () => {
        render(<PostList posts={[makePost(1)]} page={1} totalPages={3} currentTag="news" />)
        const next = screen.getByRole('link', { name: /tiếp/i })
        expect(next.getAttribute('href')).toBe('/blog?tag=news&page=2')
    })
})
