/**
 * Component Tests: BlogEditor
 *
 * [P0] Admin blog editor — rendering, slug autogen, tag chips, cover upload, submit flow.
 * Mocks: Tiptap editor (@tiptap/react), next/navigation, blog server actions, image compression.
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BlogEditor from '../BlogEditor'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}))

const mockCreatePost = jest.fn()
const mockUpdatePost = jest.fn()
const mockUploadBlogImage = jest.fn()
jest.mock('@/actions/blog', () => ({
    createPost: (...args: any[]) => mockCreatePost(...args),
    updatePost: (...args: any[]) => mockUpdatePost(...args),
    uploadBlogImage: (...args: any[]) => mockUploadBlogImage(...args),
}))

// Mock browser-image-compression — identity passthrough
jest.mock('browser-image-compression', () => ({
    __esModule: true,
    default: jest.fn((file: File) => Promise.resolve(file)),
}))

// Mock Tiptap — lightweight stub supporting chain().focus().setImage({src}).run() and getHTML()
const chainMock = {
    focus: jest.fn(() => chainMock),
    setImage: jest.fn(() => chainMock),
    toggleBold: jest.fn(() => chainMock),
    toggleItalic: jest.fn(() => chainMock),
    toggleHeading: jest.fn(() => chainMock),
    toggleBulletList: jest.fn(() => chainMock),
    toggleOrderedList: jest.fn(() => chainMock),
    toggleBlockquote: jest.fn(() => chainMock),
    toggleCodeBlock: jest.fn(() => chainMock),
    run: jest.fn(() => true),
}

const editorStub = {
    chain: jest.fn(() => chainMock),
    isActive: jest.fn(() => false),
    getHTML: jest.fn(() => '<p>Nội dung bài viết</p>'),
}

jest.mock('@tiptap/react', () => ({
    useEditor: () => editorStub,
    EditorContent: ({ editor: _editor }: any) => <div data-testid="editor-content" />,
}))
jest.mock('@tiptap/starter-kit', () => ({ __esModule: true, default: {} }))
jest.mock('@tiptap/extension-image', () => ({
    __esModule: true,
    default: { configure: () => ({}) },
}))
jest.mock('@tiptap/extension-link', () => ({
    __esModule: true,
    default: { configure: () => ({}) },
}))
jest.mock('@tiptap/extension-placeholder', () => ({
    __esModule: true,
    default: { configure: () => ({}) },
}))

// StarterKit.configure pattern
beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sk = require('@tiptap/starter-kit').default as any
    sk.configure = () => ({})
})

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks()
    mockCreatePost.mockResolvedValue({ success: true, id: 'new-post-id' })
    mockUpdatePost.mockResolvedValue({ success: true })
    mockUploadBlogImage.mockResolvedValue({ success: true, url: 'https://cdn.example.com/uploaded.webp' })
})

// ─── Render ──────────────────────────────────────────────────────────────────

describe('[P0] BlogEditor — rendering', () => {
    test('[P0] renders title input', () => {
        render(<BlogEditor />)
        expect(screen.getByPlaceholderText(/nhập tiêu đề/i)).toBeInTheDocument()
    })

    test('[P0] renders slug input', () => {
        render(<BlogEditor />)
        expect(screen.getByPlaceholderText(/url-slug-bai-viet/i)).toBeInTheDocument()
    })

    test('[P0] renders editor content area', () => {
        render(<BlogEditor />)
        expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    test('[P0] renders "Lưu Draft" and "Publish ngay" buttons', () => {
        render(<BlogEditor />)
        expect(screen.getByRole('button', { name: /lưu draft/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /publish ngay/i })).toBeInTheDocument()
    })

    test('[P0] renders excerpt textarea', () => {
        render(<BlogEditor />)
        expect(screen.getByPlaceholderText(/mô tả ngắn về bài viết/i)).toBeInTheDocument()
    })

    test('[P0] pre-fills fields when `post` prop is provided', () => {
        render(
            <BlogEditor
                post={{
                    id: 'p1',
                    title: 'Tiêu đề cũ',
                    slug: 'tieu-de-cu',
                    content: '<p>cũ</p>',
                    excerpt: 'Tóm tắt cũ',
                    cover_image: null,
                    status: 'draft',
                    tags: ['a', 'b'],
                    meta_title: null,
                    meta_desc: null,
                }}
            />
        )
        expect((screen.getByPlaceholderText(/nhập tiêu đề/i) as HTMLInputElement).value).toBe('Tiêu đề cũ')
        expect((screen.getByPlaceholderText(/url-slug-bai-viet/i) as HTMLInputElement).value).toBe('tieu-de-cu')
        expect(screen.getByText('a')).toBeInTheDocument()
        expect(screen.getByText('b')).toBeInTheDocument()
    })
})

// ─── Slug Autogen ────────────────────────────────────────────────────────────

describe('[P0] BlogEditor — slug autogen', () => {
    test('[P0] auto-generates slug from title (Vietnamese → kebab-case)', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const titleInput = screen.getByPlaceholderText(/nhập tiêu đề/i)
        await user.type(titleInput, 'Cây Dó Đen là gì?')
        await waitFor(() => {
            expect((screen.getByPlaceholderText(/url-slug-bai-viet/i) as HTMLInputElement).value).toBe('cay-do-den-la-gi')
        })
    })

    test('[P0] manual slug edit disables autogen', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const slugInput = screen.getByPlaceholderText(/url-slug-bai-viet/i)
        await user.type(slugInput, 'custom-slug')
        const titleInput = screen.getByPlaceholderText(/nhập tiêu đề/i)
        await user.type(titleInput, 'New Title')
        // slug should remain manual
        expect((slugInput as HTMLInputElement).value).toBe('custom-slug')
    })

    test('[P0] "Tự động" button regenerates slug from title and re-enables autogen', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const titleInput = screen.getByPlaceholderText(/nhập tiêu đề/i)
        await user.type(titleInput, 'Hello World')
        const slugInput = screen.getByPlaceholderText(/url-slug-bai-viet/i) as HTMLInputElement
        await user.clear(slugInput)
        await user.type(slugInput, 'manual')
        await user.click(screen.getByRole('button', { name: /tự động/i }))
        expect(slugInput.value).toBe('hello-world')
    })

    test('[P1] shows slug preview /blog/...', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const titleInput = screen.getByPlaceholderText(/nhập tiêu đề/i)
        await user.type(titleInput, 'abc')
        expect(screen.getByText(/\/blog\/abc/i)).toBeInTheDocument()
    })

    test('[P1] slug shows "..." placeholder when empty', () => {
        render(<BlogEditor />)
        expect(screen.getByText(/\/blog\/\.\.\./i)).toBeInTheDocument()
    })
})

// ─── Tag Chips ───────────────────────────────────────────────────────────────

describe('[P1] BlogEditor — tag chips', () => {
    test('[P1] adds tag when pressing Enter', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const tagInput = screen.getByPlaceholderText(/nhập tag/i)
        await user.type(tagInput, 'growth{Enter}')
        expect(screen.getByText('growth')).toBeInTheDocument()
    })

    test('[P1] adds tag when pressing comma', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const tagInput = screen.getByPlaceholderText(/nhập tag/i)
        await user.type(tagInput, 'design,')
        expect(screen.getByText('design')).toBeInTheDocument()
    })

    test('[P1] does not duplicate tags', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const tagInput = screen.getByPlaceholderText(/nhập tag/i)
        await user.type(tagInput, 'react{Enter}')
        await user.type(tagInput, 'react{Enter}')
        expect(screen.getAllByText('react')).toHaveLength(1)
    })

    test('[P1] removes tag when clicking × button', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const tagInput = screen.getByPlaceholderText(/nhập tag/i)
        await user.type(tagInput, 'remove-me{Enter}')
        expect(screen.getByText('remove-me')).toBeInTheDocument()
        const removeBtn = screen.getAllByRole('button', { name: '×' })[0]
        await user.click(removeBtn)
        expect(screen.queryByText('remove-me')).not.toBeInTheDocument()
    })
})

// ─── Cover Upload ────────────────────────────────────────────────────────────

describe('[P1] BlogEditor — cover image upload', () => {
    test('[P1] uploads cover image and updates input value on success', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        // Cover upload input identified via explicit data-testid
        const coverFileInput = screen.getByTestId('cover-file-input') as HTMLInputElement
        const file = new File(['image-bytes'], 'cover.jpg', { type: 'image/jpeg' })
        await user.upload(coverFileInput, file)
        await waitFor(() => expect(mockUploadBlogImage).toHaveBeenCalled())
        const coverUrlInput = screen.getByPlaceholderText(/https:\/\/.*hoặc upload/i) as HTMLInputElement
        await waitFor(() => expect(coverUrlInput.value).toBe('https://cdn.example.com/uploaded.webp'))
    })

    test('[P1] shows error when upload fails', async () => {
        mockUploadBlogImage.mockResolvedValueOnce({ success: false, error: 'Upload thất bại do server' })
        const user = userEvent.setup()
        render(<BlogEditor />)
        const coverFileInput = screen.getByTestId('cover-file-input') as HTMLInputElement
        const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' })
        await user.upload(coverFileInput, file)
        await waitFor(() => {
            expect(screen.getByText(/upload thất bại do server/i)).toBeInTheDocument()
        })
    })

    test('[P1] can set cover image via URL input', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const coverInput = screen.getByPlaceholderText(/https:\/\/.*hoặc upload/i) as HTMLInputElement
        await user.type(coverInput, 'https://example.com/x.jpg')
        expect(coverInput.value).toBe('https://example.com/x.jpg')
    })

    test('[P1] renders preview <img> when coverImage is set', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const coverInput = screen.getByPlaceholderText(/https:\/\/.*hoặc upload/i) as HTMLInputElement
        await user.type(coverInput, 'https://example.com/preview.jpg')
        expect(screen.getByAltText(/cover preview/i)).toBeInTheDocument()
    })
})

// ─── Submit ──────────────────────────────────────────────────────────────────

describe('[P1] BlogEditor — submit flow', () => {
    test('[P0] calls createPost on "Lưu Draft" and redirects with new id', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        await user.type(screen.getByPlaceholderText(/nhập tiêu đề/i), 'Bài mới')
        await user.click(screen.getByRole('button', { name: /lưu draft/i }))
        await waitFor(() => expect(mockCreatePost).toHaveBeenCalled())
        const fd = mockCreatePost.mock.calls[0][0] as FormData
        expect(fd.get('status')).toBe('draft')
        expect(fd.get('title')).toBe('Bài mới')
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/crm/admin/blog/new-post-id/edit'))
    })

    test('[P0] calls createPost with status=published on "Publish ngay"', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        await user.type(screen.getByPlaceholderText(/nhập tiêu đề/i), 'To publish')
        await user.click(screen.getByRole('button', { name: /publish ngay/i }))
        await waitFor(() => expect(mockCreatePost).toHaveBeenCalled())
        const fd = mockCreatePost.mock.calls[0][0] as FormData
        expect(fd.get('status')).toBe('published')
    })

    test('[P1] calls updatePost when editing existing post (does not redirect)', async () => {
        const user = userEvent.setup()
        render(
            <BlogEditor
                post={{
                    id: 'existing-id',
                    title: 'existing',
                    slug: 'existing',
                    content: '<p>x</p>',
                    excerpt: null,
                    cover_image: null,
                    status: 'draft',
                    tags: [],
                    meta_title: null,
                    meta_desc: null,
                }}
            />
        )
        await user.click(screen.getByRole('button', { name: /lưu draft/i }))
        await waitFor(() => expect(mockUpdatePost).toHaveBeenCalled())
        expect(mockUpdatePost.mock.calls[0][0]).toBe('existing-id')
        expect(mockPush).not.toHaveBeenCalled()
    })

    test('[P1] shows error banner when save fails', async () => {
        mockCreatePost.mockResolvedValueOnce({ success: false, error: 'Slug đã tồn tại' })
        const user = userEvent.setup()
        render(<BlogEditor />)
        await user.type(screen.getByPlaceholderText(/nhập tiêu đề/i), 'bad')
        await user.click(screen.getByRole('button', { name: /lưu draft/i }))
        await waitFor(() => expect(screen.getByText(/slug đã tồn tại/i)).toBeInTheDocument())
    })
})

// ─── Toolbar ─────────────────────────────────────────────────────────────────

describe('[P2] BlogEditor — toolbar', () => {
    test('[P2] clicking Bold calls editor.chain().focus().toggleBold().run()', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        await user.click(screen.getByRole('button', { name: /^bold$/i }))
        expect(chainMock.toggleBold).toHaveBeenCalled()
        expect(chainMock.run).toHaveBeenCalled()
    })

    test('[P2] clicking H2 toggles heading level 2', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        await user.click(screen.getByRole('button', { name: /^heading 2$/i }))
        expect(chainMock.toggleHeading).toHaveBeenCalledWith({ level: 2 })
    })

    test('[P2] prompts for URL when clicking "Chèn ảnh từ URL" and inserts image', async () => {
        const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('https://example.com/pic.jpg')
        const user = userEvent.setup()
        render(<BlogEditor />)
        await user.click(screen.getByRole('button', { name: /chèn ảnh từ url/i }))
        expect(promptSpy).toHaveBeenCalled()
        expect(chainMock.setImage).toHaveBeenCalledWith({ src: 'https://example.com/pic.jpg' })
        promptSpy.mockRestore()
    })
})

// ─── Accessibility ───────────────────────────────────────────────────────────

describe('[P2] BlogEditor — accessibility', () => {
    test('[P2] all required fields have visible labels', () => {
        render(<BlogEditor />)
        expect(screen.getByText(/tiêu đề/i)).toBeInTheDocument()
        expect(screen.getByText(/^slug/i)).toBeInTheDocument()
        expect(screen.getByText(/^nội dung/i)).toBeInTheDocument()
    })

    test('[P2] meta title shows character counter', async () => {
        const user = userEvent.setup()
        render(<BlogEditor />)
        const metaInput = screen.getByPlaceholderText(/meta title/i)
        await user.type(metaInput, 'abcde')
        expect(screen.getByText(/5\/60 ký tự/i)).toBeInTheDocument()
    })
})
