/**
 * Unit Tests: blog actions
 *
 * [P0] Blog CRUD — auth guard (throws), validation, slug uniqueness.
 */

import { createPost, updatePost, deletePost, uploadBlogImage } from '../blog'

const mockGetUser = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => Promise.resolve({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    })),
    createServiceRoleClient: jest.fn(() => ({
        storage: {
            from: () => ({
                upload: jest.fn(() => Promise.resolve({ error: null })),
                getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn.example.com/img.jpg' } })),
            }),
        },
        from: mockFrom,
    })),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockAdminAuth() {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null })
    // verifyAdmin calls: auth.getUser + from('users').select().eq().single()
    // Then createPost calls: from('posts').select().eq().maybeSingle() + insert().select().single()
    mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
            return {
                select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }),
            }
        }
        if (table === 'posts') {
            return {
                select: () => ({
                    eq: () => ({
                        maybeSingle: () => Promise.resolve({ data: null }),
                        single: () => Promise.resolve({ data: { published_at: null, status: 'draft' } }),
                        neq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                    }),
                }),
                insert: () => ({
                    select: () => ({
                        single: () => Promise.resolve({ data: { id: 'post-1' }, error: null }),
                    }),
                }),
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
                delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
            }
        }
        return {}
    })
}

function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })
}

function buildFormData(fields: Record<string, string>): FormData {
    const fd = new FormData()
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
    return fd
}

const validPostData = {
    title: 'Bài viết test',
    slug: 'bai-viet-test',
    content: '<p>Nội dung bài viết hợp lệ</p>',
    status: 'draft',
    tags: '[]',
}

beforeEach(() => jest.clearAllMocks())

// ─── createPost ───────────────────────────────────────────────────────────────

describe('[P0] createPost — auth guard', () => {
    test('[P0] throws Unauthorized when not authenticated', async () => {
        mockUnauthenticated()
        await expect(createPost(buildFormData(validPostData))).rejects.toThrow(/unauthorized/i)
    })

    test('[P0] throws Forbidden when role is not admin', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
        mockFrom.mockReturnValue({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'user' } }) }) }),
        })
        await expect(createPost(buildFormData(validPostData))).rejects.toThrow(/forbidden/i)
    })
})

describe('[P0] createPost — validation', () => {
    beforeEach(() => mockAdminAuth())

    test('[P0] returns error when title is empty', async () => {
        const result = await createPost(buildFormData({ ...validPostData, title: '' }))
        expect(result?.success).toBe(false)
        expect(result?.error).toMatch(/tiêu đề/i)
    })

    test('[P0] returns error when slug is empty', async () => {
        const result = await createPost(buildFormData({ ...validPostData, slug: '' }))
        expect(result?.success).toBe(false)
        expect(result?.error).toMatch(/slug/i)
    })

    test('[P0] returns error for invalid slug format', async () => {
        const result = await createPost(buildFormData({ ...validPostData, slug: 'Bài Viết Test' }))
        expect(result?.success).toBe(false)
        expect(result?.error).toMatch(/slug chỉ được/i)
    })

    test('[P0] returns error when content is empty', async () => {
        const result = await createPost(buildFormData({ ...validPostData, content: '' }))
        expect(result?.success).toBe(false)
        expect(result?.error).toMatch(/nội dung/i)
    })

    test('[P1] returns error when slug already exists', async () => {
        // Override posts maybeSingle to return existing
        mockFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
            }
            return {
                select: () => ({
                    eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'existing-post' } }) }),
                }),
            }
        })
        const result = await createPost(buildFormData(validPostData))
        expect(result?.success).toBe(false)
        expect(result?.error).toMatch(/slug đã tồn tại/i)
    })

    test('[P1] succeeds with valid data', async () => {
        const result = await createPost(buildFormData(validPostData))
        expect(result?.success).toBe(true)
        expect(result?.id).toBe('post-1')
    })
})

// ─── updatePost ───────────────────────────────────────────────────────────────

describe('[P1] updatePost — validation', () => {
    beforeEach(() => mockAdminAuth())

    test('[P0] throws when not authenticated', async () => {
        mockUnauthenticated()
        await expect(updatePost('post-1', buildFormData(validPostData))).rejects.toThrow()
    })

    test('[P1] returns error when title is empty', async () => {
        const result = await updatePost('post-1', buildFormData({ ...validPostData, title: '' }))
        expect(result?.success).toBe(false)
    })

    test('[P1] returns error for content that is just empty paragraph', async () => {
        const result = await updatePost('post-1', buildFormData({ ...validPostData, content: '<p></p>' }))
        expect(result?.success).toBe(false)
        expect(result?.error).toMatch(/nội dung/i)
    })

    test('[P1] succeeds with valid data', async () => {
        const result = await updatePost('post-1', buildFormData(validPostData))
        expect(result?.success).toBe(true)
    })
})

// ─── deletePost ───────────────────────────────────────────────────────────────

describe('[P1] deletePost', () => {
    test('[P0] throws when not authenticated', async () => {
        mockUnauthenticated()
        await expect(deletePost('post-1')).rejects.toThrow()
    })

    test('[P1] succeeds for admin', async () => {
        mockAdminAuth()
        const result = await deletePost('post-1')
        expect(result?.success).toBe(true)
    })
})

// ─── uploadBlogImage ──────────────────────────────────────────────────────────

describe('[P1] uploadBlogImage — validation', () => {
    beforeEach(() => mockAdminAuth())

    test('[P1] returns error when no file provided', async () => {
        const fd = new FormData()
        const result = await uploadBlogImage(fd)
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/file/i)
    })

    test('[P1] returns error for invalid file type', async () => {
        const fd = new FormData()
        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
        fd.append('file', file)
        const result = await uploadBlogImage(fd)
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/JPG|PNG|WebP|GIF/i)
    })

    test('[P1] returns error for file over 5MB', async () => {
        const fd = new FormData()
        const bigContent = new Uint8Array(6 * 1024 * 1024) // 6MB
        const file = new File([bigContent], 'big.jpg', { type: 'image/jpeg' })
        fd.append('file', file)
        const result = await uploadBlogImage(fd)
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/5MB|quá lớn/i)
    })
})
