'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface AdminProfile {
    id: string
    full_name: string
    email: string
    role: string
    last_login?: string
}

export interface NotificationPreferences {
    orders: boolean
    withdrawals: boolean
    alerts: boolean
}

export interface AdminPreferences {
    user_id: string
    email_notifications: NotificationPreferences
    in_app_sound: boolean
    created_at: string
    updated_at: string
}

// Get admin profile
export async function getAdminProfile() {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Verify admin role
    const { data: profile, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return { success: false, error: 'Failed to fetch profile' }
    }

    if (!['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized - Admin access required' }
    }

    return {
        success: true,
        profile: {
            ...profile,
            last_login: user.last_sign_in_at
        } as AdminProfile
    }
}

// Update admin profile
export async function updateAdminProfile(fullName: string) {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Verify admin role
    const { data: currentProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!currentProfile || !['admin', 'super_admin'].includes(currentProfile.role)) {
        return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating profile:', error)
        return { success: false, error: 'Failed to update profile' }
    }

    return { success: true }
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string) {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
    })

    if (signInError) {
        return { success: false, error: 'Current password is incorrect' }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (updateError) {
        console.error('Error updating password:', updateError)
        return { success: false, error: 'Failed to update password' }
    }

    return { success: true }
}

// Get notification preferences
export async function getNotificationPreferences() {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: preferences, error } = await supabase
        .from('admin_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching preferences:', error)
        return { success: false, error: 'Failed to fetch preferences' }
    }

    // Return default preferences if none exist
    if (!preferences) {
        return {
            success: true,
            preferences: {
                user_id: user.id,
                email_notifications: { orders: true, withdrawals: true, alerts: true },
                in_app_sound: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as AdminPreferences
        }
    }

    return { success: true, preferences: preferences as AdminPreferences }
}

// Update notification preferences
export async function updateNotificationPreferences(
    emailNotifications: NotificationPreferences,
    inAppSound: boolean
) {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, error: 'Unauthorized - Admin access required' }
    }

    // Upsert preferences
    const { error } = await supabase
        .from('admin_preferences')
        .upsert({
            user_id: user.id,
            email_notifications: emailNotifications,
            in_app_sound: inAppSound,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error updating preferences:', error)
        return { success: false, error: 'Failed to update preferences' }
    }

    return { success: true }
}
