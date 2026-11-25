'use server'

import { createServerClient } from '@/lib/supabase/server'

export async function updateUserLocale(locale: 'vi' | 'en') {
  if (locale !== 'vi' && locale !== 'en') {
    return { success: false, error: 'Invalid locale' }
  }

  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: true, guest: true }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ locale })
      .eq('id', user.id)

    if (updateError) {
      console.error('[updateUserLocale] Failed to update locale:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, guest: false }
  } catch (err) {
    console.error('[updateUserLocale] Unexpected error:', err)
    return { success: false, error: 'Internal server error' }
  }
}
