/**
 * Unit Tests: blog actions
 *
 * [P0] Blog CRUD — auth guard (throws), validation, slug uniqueness.
 */

import { createPost, updatePost, deletePost, uploadBlogImage } from '../blog'
import { revalidatePath } from 'next/cache'

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

// ─── uploadBlogImage — success path ───────────────────────────────────────────

describe('[P1] uploadBlogImage — success path', () => {
    const { createServiceRoleClient } = jest.requireMock('@/lib/supabase/server') as {
        createServiceRoleClient: jest.Mock
    }

    beforeEach(() => {
        mockAdminAuth()
    })

    test('[P1] calls storage.upload with correct contentType and returns publicUrl', async () => {
        const uploadMock = jest.fn(() => Promise.resolve({ error: null }))
        const getPublicUrlMock = jest.fn(() => ({
            data: { publicUrl: 'https://cdn.example.com/blog-images/abc.jpg' },
        }))
        createServiceRoleClient.mockReturnValueOnce({
            storage: {
                from: () => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }),
            },
            from: mockFrom,
        })

        const fd = new FormData()
        const file = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
        fd.append('file', file)

        const result = await uploadBlogImage(fd)
        expect(result.success).toBe(true)
        expect(result.url).toBe('https://cdn.example.com/blog-images/abc.jpg')
        expect(uploadMock).toHaveBeenCalledTimes(1)
        const [filename, uploadedFile, opts] = uploadMock.mock.calls[0] as [string, File, { contentType: string }]
        expect(filename).toMatch(/^[\w-]+\.jpg$/i)
        expect(uploadedFile).toBe(file)
        expect(opts.contentType).toBe('image/jpeg')
    })

    test('[P1] generates unique filename with timestamp and extension from file', async () => {
        const uploadMock = jest.fn(() => Promise.resolve({ error: null }))
        createServiceRoleClient.mockReturnValueOnce({
            storage: {
                from: () => ({
                    upload: uploadMock,
                    getPublicUrl: () => ({ data: { publicUrl: 'https://x/y.webp' } }),
                }),
            },
            from: mockFrom,
        })

        const fd = new FormData()
        const file = new File(['x'], 'cover.webp', { type: 'image/webp' })
        fd.append('file', file)
        await uploadBlogImage(fd)

        const [filename] = uploadMock.mock.calls[0] as [string]
        expect(filename.endsWith('.webp')).toBe(true)
    })

    test('[P1] returns error when storage.upload fails', async () => {
        createServiceRoleClient.mockReturnValueOnce({
            storage: {
                from: () => ({
                    upload: jest.fn(() => Promise.resolve({ error: { message: 'Storage quota exceeded' } })),
                    getPublicUrl: jest.fn(),
                }),
            },
            from: mockFrom,
        })

        const fd = new FormData()
        const file = new File(['x'], 'x.png', { type: 'image/png' })
        fd.append('file', file)
        const result = await uploadBlogImage(fd)
        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
    })
})

// ─── createPost — DB error ────────────────────────────────────────────────────

describe('[P1] createPost — DB error', () => {
    beforeEach(() => mockAdminAuth())

    test('[P1] returns error when insert returns database error', async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
            }
            return {
                select: () => ({
                    eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                }),
                insert: () => ({
                    select: () => ({
                        single: () => Promise.resolve({ data: null, error: { message: 'connection refused' } }),
                    }),
                }),
            }
        })
        const result = await createPost(buildFormData(validPostData))
        expect(result?.success).toBe(false)
        expect(result?.error).toMatch(/không thể tạo bài viết/i)
    })

    test('[P1] returns error when insert result has no id', async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
            }
            return {
                select: () => ({
                    eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                }),
                insert: () => ({
                    select: () => ({
                        single: () => Promise.resolve({ data: null, error: { message: 'insert failed' } }),
                    }),
                }),
            }
        })
        const result = await createPost(buildFormData(validPostData))
        expect(result?.success).toBe(false)
    })
})

// ─── updatePost — slug conflict ───────────────────────────────────────────────

describe('[P1] updatePost — slug conflict', () => {
    beforeEach(() => mockAdminAuth())

    test('[P1] returns error when slug already taken by another post (.neq check)', async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
            }
            return {
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: { published_at: null, status: 'draft' } }),
                        neq: () => ({
                            maybeSingle: () => Promise.resolve({ data: { id: 'another-post' } }),
                        }),
                    }),
                }),
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            }
        })
        const result = await updatePost('post-1', buildFormData(validPostData))
        expect(result?.success).toBe(false)
        expect(result?.error).toMatch(/slug đã tồn tại/i)
    })

    test('[P1] succeeds when same post keeps its own slug', async () => {
        // .neq('id', 'post-1').maybeSingle() returns null → no conflict
        mockFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
            }
            return {
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: { published_at: null, status: 'draft' } }),
                        neq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                    }),
                }),
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            }
        })
        const result = await updatePost('post-1', buildFormData(validPostData))
        expect(result?.success).toBe(true)
    })
})

// ─── post_translations i18n support ──────────────────────────────────────────

describe('[P1] post_translations i18n support', () => {
    beforeEach(() => mockAdminAuth())

    test('[P1] createPost upserts post_translations when EN fields provided', async () => {
        let translationUpsert: any = null
        mockFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
            }
            if (table === 'posts') {
                return {
                    select: () => ({
                        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                    }),
                    insert: () => ({
                        select: () => ({
                            single: () => Promise.resolve({ data: { id: 'post-new-123' }, error: null }),
                        }),
                    }),
                }
            }
            if (table === 'post_translations') {
                return {
                    select: () => ({
                        eq: () => ({
                            eq: () => ({
                                maybeSingle: () => Promise.resolve({ data: null }),
                                neq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                            }),
                        }),
                    }),
                    insert: (data: any) => {
                        translationUpsert = data
                        return Promise.resolve({ error: null })
                    },
                }
            }
            return {}
        })

        const fd = buildFormData({
            ...validPostData,
            en_title: 'English Title',
            en_slug: 'english-title',
            en_content: '<p>English content</p>',
            en_excerpt: 'English excerpt',
        })

        const result = await createPost(fd)
        expect(result.success).toBe(true)
        expect(translationUpsert).toEqual(
            expect.objectContaining({
                post_id: 'post-new-123',
                locale: 'en',
                title: 'English Title',
                slug: 'english-title',
                content: '<p>English content</p>',
                excerpt: 'English excerpt',
            })
        )
    })

    test('[P1] updatePost removes post_translations when EN fields are blank', async () => {
        let deletedPostId: string | null = null
        mockFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
            }
            if (table === 'posts') {
                return {
                    select: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({ data: { published_at: null, status: 'draft' } }),
                            neq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                        }),
                    }),
                    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
                }
            }
            if (table === 'post_translations') {
                return {
                    delete: () => ({
                        eq: (_col1: string, val1: string) => ({
                            eq: (_col2: string, _val2: string) => {
                                deletedPostId = val1
                                return Promise.resolve({ error: null })
                            },
                        }),
                    }),
                }
            }
            return {}
        })

        const fd = buildFormData({
            ...validPostData,
            en_title: '',
        })

        const result = await updatePost('post-1', fd)
        expect(result.success).toBe(true)
        expect(deletedPostId).toBe('post-1')
    })

    describe('[PARTIAL_EN_ROW] rejects when EN has title without slug or slug without title', () => {
        beforeEach(() => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'users') {
                    return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
                }
                if (table === 'posts') {
                    return {
                        select: () => ({
                            eq: () => ({
                                maybeSingle: () => Promise.resolve({ data: null }),
                                neq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                            }),
                        }),
                    }
                }
                return {}
            })
        })

        test('createPost rejects when en_title is provided but en_slug is missing', async () => {
            const fd = buildFormData({
                ...validPostData,
                en_title: 'English Title Only',
                en_slug: '',
            })
            const result = await createPost(fd)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/slug tiếng anh/i)
        })

        test('createPost rejects when en_slug is provided but en_title is missing', async () => {
            const fd = buildFormData({
                ...validPostData,
                en_title: '',
                en_slug: 'english-slug-only',
            })
            const result = await createPost(fd)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/tiêu đề tiếng anh/i)
        })

        test('updatePost rejects when en_title is provided but en_slug is missing', async () => {
            const fd = buildFormData({
                ...validPostData,
                en_title: 'Updated English Title Only',
                en_slug: '',
            })
            const result = await updatePost('post-1', fd)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/slug tiếng anh/i)
        })

        test('updatePost rejects when en_slug is provided but en_title is missing', async () => {
            const fd = buildFormData({
                ...validPostData,
                en_title: '',
                en_slug: 'updated-english-slug-only',
            })
            const result = await updatePost('post-1', fd)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/tiêu đề tiếng anh/i)
        })

        test('createPost rejects when en_content is provided without en_title/en_slug', async () => {
            const fd = buildFormData({
                ...validPostData,
                en_content: '<p>English body only</p>',
            })
            const result = await createPost(fd)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/tiêu đề tiếng anh/i)
        })

        test('updatePost rejects when en_content is provided without en_title/en_slug', async () => {
            const fd = buildFormData({
                ...validPostData,
                en_content: '<p>English body only</p>',
            })
            const result = await updatePost('post-1', fd)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/tiêu đề tiếng anh/i)
        })
    })

    describe('[TRANSLATION_ERRORS_AND_REVALIDATION]', () => {
        test('createPost returns error when post_translations insert fails', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'users') {
                    return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
                }
                if (table === 'posts') {
                    return {
                        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
                        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'post-new-123' }, error: null }) }) }),
                    }
                }
                if (table === 'post_translations') {
                    return {
                        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }) }),
                        insert: () => Promise.resolve({ error: { message: 'db error inserting translation' } }),
                    }
                }
                return {}
            })

            const fd = buildFormData({
                ...validPostData,
                en_title: 'English Title',
                en_slug: 'english-title',
            })
            const result = await createPost(fd)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/không thể lưu bản dịch tiếng anh/i)
        })

        test('updatePost returns error when post_translations update fails', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'users') {
                    return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
                }
                if (table === 'posts') {
                    return {
                        select: () => ({
                            eq: () => ({
                                single: () => Promise.resolve({ data: { published_at: null, status: 'draft' } }),
                                neq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                            }),
                        }),
                        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
                    }
                }
                if (table === 'post_translations') {
                    return {
                        select: (cols: string) => ({
                            eq: () => ({
                                eq: () => ({
                                    neq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                                    maybeSingle: () => Promise.resolve({
                                        data: cols.includes('slug') ? { id: 'trans-1', slug: 'old-slug' } : null,
                                    }),
                                }),
                            }),
                        }),
                        update: () => ({ eq: () => Promise.resolve({ error: { message: 'update failed' } }) }),
                    }
                }
                return {}
            })

            const fd = buildFormData({
                ...validPostData,
                en_title: 'Updated English Title',
                en_slug: 'new-slug',
            })
            const result = await updatePost('post-1', fd)
            expect(result.success).toBe(false)
            expect(result.error).toMatch(/không thể lưu bản dịch tiếng anh/i)
        })

        test('updatePost revalidates both old and new EN slug when enSlug changes', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'users') {
                    return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
                }
                if (table === 'posts') {
                    return {
                        select: () => ({
                            eq: () => ({
                                single: () => Promise.resolve({ data: { published_at: null, status: 'draft' } }),
                                neq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                            }),
                        }),
                        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
                    }
                }
                if (table === 'post_translations') {
                    return {
                        select: (cols: string) => ({
                            eq: () => ({
                                eq: () => ({
                                    neq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
                                    maybeSingle: () => Promise.resolve({
                                        data: cols.includes('slug') ? { id: 'trans-1', slug: 'old-en-slug' } : null,
                                    }),
                                }),
                            }),
                        }),
                        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
                    }
                }
                return {}
            })

            const fd = buildFormData({
                ...validPostData,
                en_title: 'Updated English Title',
                en_slug: 'new-en-slug',
            })
            const result = await updatePost('post-1', fd)
            expect(result.success).toBe(true)
            expect(revalidatePath).toHaveBeenCalledWith('/en/blog/old-en-slug')
            expect(revalidatePath).toHaveBeenCalledWith('/en/blog/new-en-slug')
        })

        test('deletePost revalidates /en/blog', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'users') {
                    return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' } }) }) }) }
                }
                if (table === 'posts') {
                    return { delete: () => ({ eq: () => Promise.resolve({ error: null }) }) }
                }
                return {}
            })

            const result = await deletePost('post-1')
            expect(result.success).toBe(true)
            expect(revalidatePath).toHaveBeenCalledWith('/en/blog')
        })
    })
})
