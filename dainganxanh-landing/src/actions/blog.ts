'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper: verify current user is admin
async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Forbidden')
  }

  return { supabase, user }
}

// ─── Create Post ────────────────────────────────────────────────────────────

export async function createPost(formData: FormData) {
  const { supabase, user } = await verifyAdmin()

  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const content = formData.get('content') as string
  const excerpt = (formData.get('excerpt') as string) || null
  const status = formData.get('status') as string
  const coverImage = (formData.get('cover_image') as string) || null
  const tagsRaw = (formData.get('tags') as string) || '[]'
  const metaTitle = (formData.get('meta_title') as string) || null
  const metaDesc = (formData.get('meta_desc') as string) || null

  if (!title || !title.trim()) {
    return { success: false, error: 'Tiêu đề không được để trống' }
  }
  if (!slug || !slug.trim()) {
    return { success: false, error: 'Slug không được để trống' }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { success: false, error: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang' }
  }
  if (!content || !content.trim() || content.trim() === '<p></p>') {
    return { success: false, error: 'Nội dung bài viết không được để trống' }
  }

  // Check slug unique
  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Slug đã tồn tại, vui lòng chọn slug khác' }
  }

  // EN translation fields
  const enTitle = ((formData.get('en_title') as string) || '').trim() || null
  const enSlug = ((formData.get('en_slug') as string) || '').trim() || null
  const enContent = (formData.get('en_content') as string) || null
  const enExcerpt = (formData.get('en_excerpt') as string) || null
  const enMetaTitle = (formData.get('en_meta_title') as string) || null
  const enMetaDesc = (formData.get('en_meta_desc') as string) || null

  const hasEnField = Boolean(enTitle || enSlug || enContent || enExcerpt || enMetaTitle || enMetaDesc)

  if (hasEnField) {
    if (!enTitle) {
      return { success: false, error: 'Tiêu đề tiếng Anh không được để trống' }
    }
    if (!enSlug) {
      return { success: false, error: 'Slug tiếng Anh không được để trống' }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(enSlug)) {
      return { success: false, error: 'Slug tiếng Anh chỉ được chứa chữ thường, số và dấu gạch ngang' }
    }
    const { data: existingEn } = await supabase
      .from('post_translations')
      .select('id')
      .eq('locale', 'en')
      .eq('slug', enSlug)
      .maybeSingle()
    if (existingEn) {
      return { success: false, error: 'Slug tiếng Anh đã tồn tại, vui lòng chọn slug khác' }
    }
  }

  let tags: string[] = []
  try {
    tags = JSON.parse(tagsRaw)
  } catch {
    tags = []
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title,
      slug,
      content,
      excerpt,
      status,
      cover_image: coverImage,
      published_at: status === 'published' ? new Date().toISOString() : null,
      author_id: user.id,
      tags,
      meta_title: metaTitle,
      meta_desc: metaDesc,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createPost error:', error)
    return { success: false, error: 'Không thể tạo bài viết. Vui lòng thử lại.' }
  }

  if (enTitle && enSlug) {
    const { error: enError } = await supabase
      .from('post_translations')
      .insert({
        post_id: post.id,
        locale: 'en',
        title: enTitle,
        slug: enSlug,
        content: enContent,
        excerpt: enExcerpt,
        meta_title: enMetaTitle,
        meta_desc: enMetaDesc,
      })
    if (enError) {
      console.error('createPost en translation error:', enError)
      return { success: false, error: 'Không thể lưu bản dịch tiếng Anh. Vui lòng thử lại.' }
    }
  }

  revalidatePath('/blog')
  revalidatePath('/en/blog')
  revalidatePath('/crm/admin/blog')
  if (enSlug) revalidatePath(`/en/blog/${enSlug}`)

  return { success: true, id: post.id }
}

// ─── Update Post ────────────────────────────────────────────────────────────

export async function updatePost(id: string, formData: FormData) {
  const { supabase } = await verifyAdmin()

  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const content = formData.get('content') as string
  const excerpt = (formData.get('excerpt') as string) || null
  const status = formData.get('status') as string
  const coverImage = (formData.get('cover_image') as string) || null
  const tagsRaw = (formData.get('tags') as string) || '[]'
  const metaTitle = (formData.get('meta_title') as string) || null
  const metaDesc = (formData.get('meta_desc') as string) || null

  if (!title || !title.trim()) {
    return { success: false, error: 'Tiêu đề không được để trống' }
  }
  if (!slug || !slug.trim()) {
    return { success: false, error: 'Slug không được để trống' }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { success: false, error: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang' }
  }
  if (!content || !content.trim() || content.trim() === '<p></p>') {
    return { success: false, error: 'Nội dung bài viết không được để trống' }
  }

  // Check slug unique (excluding current post)
  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .neq('id', id)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Slug đã tồn tại, vui lòng chọn slug khác' }
  }

  // EN translation fields
  const enTitle = ((formData.get('en_title') as string) || '').trim() || null
  const enSlug = ((formData.get('en_slug') as string) || '').trim() || null
  const enContent = (formData.get('en_content') as string) || null
  const enExcerpt = (formData.get('en_excerpt') as string) || null
  const enMetaTitle = (formData.get('en_meta_title') as string) || null
  const enMetaDesc = (formData.get('en_meta_desc') as string) || null

  const hasEnField = Boolean(enTitle || enSlug || enContent || enExcerpt || enMetaTitle || enMetaDesc)

  if (hasEnField) {
    if (!enTitle) {
      return { success: false, error: 'Tiêu đề tiếng Anh không được để trống' }
    }
    if (!enSlug) {
      return { success: false, error: 'Slug tiếng Anh không được để trống' }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(enSlug)) {
      return { success: false, error: 'Slug tiếng Anh chỉ được chứa chữ thường, số và dấu gạch ngang' }
    }
    const { data: existingEn } = await supabase
      .from('post_translations')
      .select('id')
      .eq('locale', 'en')
      .eq('slug', enSlug)
      .neq('post_id', id)
      .maybeSingle()
    if (existingEn) {
      return { success: false, error: 'Slug tiếng Anh đã tồn tại, vui lòng chọn slug khác' }
    }
  }

  let tags: string[] = []
  try {
    tags = JSON.parse(tagsRaw)
  } catch {
    tags = []
  }

  // Fetch current post to preserve published_at if already published
  const { data: currentPost } = await supabase
    .from('posts')
    .select('published_at, status')
    .eq('id', id)
    .single()

  let publishedAt = currentPost?.published_at || null
  if (status === 'published' && !publishedAt) {
    publishedAt = new Date().toISOString()
  } else if (status !== 'published') {
    publishedAt = null
  }

  const { error } = await supabase
    .from('posts')
    .update({
      title,
      slug,
      content,
      excerpt,
      status,
      cover_image: coverImage,
      published_at: publishedAt,
      tags,
      meta_title: metaTitle,
      meta_desc: metaDesc,
    })
    .eq('id', id)

  if (error) {
    console.error('updatePost error:', error)
    return { success: false, error: 'Không thể cập nhật bài viết. Vui lòng thử lại.' }
  }

  let oldEnSlug: string | null = null
  if (enTitle && enSlug) {
    const { data: currentTrans } = await supabase
      .from('post_translations')
      .select('id, slug')
      .eq('post_id', id)
      .eq('locale', 'en')
      .maybeSingle()

    if (currentTrans) {
      oldEnSlug = currentTrans.slug || null
      const { error: enUpdateError } = await supabase
        .from('post_translations')
        .update({
          title: enTitle,
          slug: enSlug,
          content: enContent,
          excerpt: enExcerpt,
          meta_title: enMetaTitle,
          meta_desc: enMetaDesc,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentTrans.id)
      if (enUpdateError) {
        console.error('updatePost en translation update error:', enUpdateError)
        return { success: false, error: 'Không thể lưu bản dịch tiếng Anh. Vui lòng thử lại.' }
      }
    } else {
      const { error: enInsertError } = await supabase
        .from('post_translations')
        .insert({
          post_id: id,
          locale: 'en',
          title: enTitle,
          slug: enSlug,
          content: enContent,
          excerpt: enExcerpt,
          meta_title: enMetaTitle,
          meta_desc: enMetaDesc,
        })
      if (enInsertError) {
        console.error('updatePost en translation insert error:', enInsertError)
        return { success: false, error: 'Không thể lưu bản dịch tiếng Anh. Vui lòng thử lại.' }
      }
    }
  } else if (!hasEnField && formData.has('en_title') && !enTitle) {
    await supabase
      .from('post_translations')
      .delete()
      .eq('post_id', id)
      .eq('locale', 'en')
  }

  revalidatePath('/blog')
  revalidatePath('/en/blog')
  revalidatePath(`/blog/${slug}`)
  if (oldEnSlug && oldEnSlug !== enSlug) {
    revalidatePath(`/en/blog/${oldEnSlug}`)
  }
  if (enSlug) revalidatePath(`/en/blog/${enSlug}`)
  revalidatePath('/crm/admin/blog')

  return { success: true }
}

// ─── Delete Post ────────────────────────────────────────────────────────────

export async function deletePost(id: string) {
  const { supabase } = await verifyAdmin()

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    console.error('deletePost error:', error)
    return { success: false, error: 'Không thể xoá bài viết. Vui lòng thử lại.' }
  }

  revalidatePath('/blog')
  revalidatePath('/en/blog')
  revalidatePath('/crm/admin/blog')

  return { success: true }
}

// ─── Upload Blog Image ───────────────────────────────────────────────────────

export async function uploadBlogImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  await verifyAdmin()

  const file = formData.get('file') as File
  if (!file || file.size === 0) {
    return { success: false, error: 'Không có file được chọn' }
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Chỉ hỗ trợ định dạng JPG, PNG, WebP, GIF' }
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'File quá lớn, tối đa 5MB' }
  }

  const supabaseAdmin = createServiceRoleClient()
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  const rawExt = file.name.split('.').pop()?.toLowerCase() ?? ''
  const fileExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('blog-images')
    .upload(fileName, file, { contentType: file.type })

  if (uploadError) {
    console.error('uploadBlogImage error:', uploadError)
    return { success: false, error: uploadError.message }
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('blog-images')
    .getPublicUrl(fileName)

  return { success: true, url: publicUrl }
}
