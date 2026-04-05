import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'])
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const EXT_MAP: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
}

export async function POST(req: NextRequest) {
    // Verify admin session
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: profile } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate content type
    const contentType = req.headers.get('content-type') || ''
    if (!ALLOWED_TYPES.has(contentType)) {
        return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WEBP, GIF, HEIC' }, { status: 415 })
    }

    // Validate size via Content-Length header
    const contentLength = Number(req.headers.get('content-length') || 0)
    if (contentLength > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 413 })
    }

    const buffer = await req.arrayBuffer()

    // Double-check actual size
    if (buffer.byteLength > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 413 })
    }

    // Derive extension from validated content type (not from user-supplied filename)
    const ext = EXT_MAP[contentType] || 'jpg'
    const storagePath = `${user.id}/${Date.now()}.${ext}`

    const { error } = await serviceSupabase.storage
        .from('payment-proofs')
        .upload(storagePath, buffer, { contentType, upsert: false })

    if (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = serviceSupabase.storage
        .from('payment-proofs')
        .getPublicUrl(storagePath)

    return NextResponse.json({ url: publicUrl, path: storagePath })
}
