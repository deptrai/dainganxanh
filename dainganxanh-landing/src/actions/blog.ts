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

  // Check slug unique
  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Slug đã tồn tại, vui lòng chọn slug khác' }
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
    return { success: false, error: error.message }
  }

  revalidatePath('/blog')
  revalidatePath('/crm/admin/blog')

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
    return { success: false, error: error.message }
  }

  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)
  revalidatePath('/crm/admin/blog')

  return { success: true }
}

// ─── Delete Post ────────────────────────────────────────────────────────────

export async function deletePost(id: string) {
  const { supabase } = await verifyAdmin()

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    console.error('deletePost error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/blog')
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

  const supabaseAdmin = createServiceRoleClient()
  const fileExt = file.name.split('.').pop()
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
