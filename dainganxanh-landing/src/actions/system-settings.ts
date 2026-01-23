'use server'

import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export interface SystemConfig {
    site_name: string
    support_email: string
    currency: 'VND' | 'USD'
    timezone: string
    date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
}

export interface EmailTemplate {
    id: string
    template_key: string
    subject: string
    html_body: string
    variables: string[]
    updated_at: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

const systemConfigSchema = z.object({
    site_name: z.string().min(1, 'Site name is required'),
    support_email: z.string().email('Invalid email format'),
    currency: z.enum(['VND', 'USD']),
    timezone: z.string().min(1, 'Timezone is required'),
    date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
})

// ============================================================================
// Helper: Verify Admin Role
// ============================================================================

async function verifyAdminRole(supabase: Awaited<ReturnType<typeof createServerClient>>) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        return { success: false, error: 'Failed to verify user role' }
    }

    if (!['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized - Admin access required' }
    }

    return { success: true, userId: user.id }
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get all system configuration settings
 */
export async function getSystemConfig() {
    const supabase = await createServerClient()

    // Verify admin role
    const authCheck = await verifyAdminRole(supabase)
    if (!authCheck.success) {
        return { success: false, error: authCheck.error }
    }

    try {
        const { data, error } = await supabase
            .from('system_config')
            .select('key, value')

        if (error) {
            console.error('Error fetching system config:', error)
            return { success: false, error: 'Failed to fetch system configuration' }
        }

        // Transform array of {key, value} to object
        const config: Record<string, any> = {}
        data?.forEach(item => {
            config[item.key] = item.value
        })

        return {
            success: true,
            config: {
                site_name: config.site_name || 'Đại Ngàn Xanh',
                support_email: config.support_email || 'support@dainganxanh.com',
                currency: config.currency || 'VND',
                timezone: config.timezone || 'Asia/Ho_Chi_Minh',
                date_format: config.date_format || 'DD/MM/YYYY'
            } as SystemConfig
        }
    } catch (error) {
        console.error('Unexpected error in getSystemConfig:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Update system configuration settings
 */
export async function updateSystemConfig(config: SystemConfig) {
    const supabase = await createServerClient()

    // Verify admin role
    const authCheck = await verifyAdminRole(supabase)
    if (!authCheck.success) {
        return { success: false, error: authCheck.error }
    }

    // Validate input
    const validation = systemConfigSchema.safeParse(config)
    if (!validation.success) {
        return {
            success: false,
            error: 'Validation failed',
            details: validation.error.errors
        }
    }

    try {
        // Update each config key individually
        const updates = Object.entries(config).map(([key, value]) => ({
            key,
            value: JSON.stringify(value)
        }))

        for (const { key, value } of updates) {
            const { error } = await supabase
                .from('system_config')
                .update({ value: value as any })
                .eq('key', key)

            if (error) {
                console.error(`Error updating ${key}:`, error)
                return { success: false, error: `Failed to update ${key}` }
            }
        }

        return { success: true, message: 'System configuration updated successfully' }
    } catch (error) {
        console.error('Unexpected error in updateSystemConfig:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Get all email templates
 */
export async function getEmailTemplates() {
    const supabase = await createServerClient()

    // Verify admin role
    const authCheck = await verifyAdminRole(supabase)
    if (!authCheck.success) {
        return { success: false, error: authCheck.error }
    }

    try {
        const { data, error } = await supabase
            .from('email_templates')
            .select('id, template_key, subject, html_body, variables, updated_at')
            .order('template_key', { ascending: true })

        if (error) {
            console.error('Error fetching email templates:', error)
            return { success: false, error: 'Failed to fetch email templates' }
        }

        return {
            success: true,
            templates: data as EmailTemplate[]
        }
    } catch (error) {
        console.error('Unexpected error in getEmailTemplates:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Generate email template preview with sample data
 */
export async function getEmailTemplatePreview(templateKey: string) {
    const supabase = await createServerClient()

    // Verify admin role
    const authCheck = await verifyAdminRole(supabase)
    if (!authCheck.success) {
        return { success: false, error: authCheck.error }
    }

    try {
        const { data, error } = await supabase
            .from('email_templates')
            .select('html_body, variables, subject')
            .eq('template_key', templateKey)
            .single()

        if (error || !data) {
            console.error('Error fetching template:', error)
            return { success: false, error: 'Template not found' }
        }

        // Sample data for preview
        const sampleData: Record<string, string> = {
            fullName: 'Nguyễn Văn A',
            amount: '5,000,000 ₫',
            bankName: 'Vietcombank',
            bankAccountNumber: '1234567890',
            rejectionReason: 'Thông tin tài khoản không chính xác',
            proofImageUrl: 'https://via.placeholder.com/600x400?text=Proof+Image'
        }

        // Replace template variables with sample data
        let previewHtml = data.html_body
        Object.entries(sampleData).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g')
            previewHtml = previewHtml.replace(regex, value)
        })

        return {
            success: true,
            preview: {
                subject: data.subject,
                html: previewHtml,
                variables: data.variables
            }
        }
    } catch (error) {
        console.error('Unexpected error in getEmailTemplatePreview:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}
