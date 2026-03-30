'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface TreeHealthUpdate {
    treeId: string
    newStatus: 'healthy' | 'sick' | 'dead'
    notes?: string
    treatmentDetails?: string
}

export interface ReplacementTask {
    id: string
    deadTreeId: string
    newTreeId: string | null
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
    assignedTo: string | null
    notes: string | null
    reason: string | null
    createdAt: string
    completedAt: string | null
}

/**
 * Update tree health status and create audit log
 */
export async function updateTreeHealth(update: TreeHealthUpdate) {
    try {
        const supabase = await createServerClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get current tree status
        const { data: tree, error: treeError } = await supabase
            .from('trees')
            .select('health_status, code, user_id')
            .eq('id', update.treeId)
            .single()

        if (treeError || !tree) {
            return { error: 'Tree not found' }
        }

        const oldStatus = tree.health_status || 'healthy'

        // Update tree health status
        console.log('[SERVER] Updating tree health_status')
        const { error: updateError } = await supabase
            .from('trees')
            .update({ health_status: update.newStatus })
            .eq('id', update.treeId)

        if (updateError) {
            return { error: updateError.message }
        }

        // Create health log entry
        const { error: logError } = await supabase
            .from('tree_health_logs')
            .insert({
                tree_id: update.treeId,
                old_status: oldStatus,
                new_status: update.newStatus,
                notes: update.notes,
                treatment_details: update.treatmentDetails,
                changed_by: user.id
            })

        if (logError) {
            console.error('Failed to create health log:', logError)
        }

        // If tree is dead, create replacement task
        if (update.newStatus === 'dead') {
            const { error: taskError } = await supabase
                .from('replacement_tasks')
                .insert({
                    dead_tree_id: update.treeId,
                    status: 'pending',
                    reason: update.notes,
                    notes: `Auto-created for dead tree ${tree.code}`
                })

            if (taskError) {
                console.error('Failed to create replacement task:', taskError)
            }

            // Notification will be sent via webhook
        }

        // If tree is sick, create 30-day follow-up task
        if (update.newStatus === 'sick') {
            // Get the health log ID we just created
            const { data: healthLog } = await supabase
                .from('tree_health_logs')
                .select('id')
                .eq('tree_id', update.treeId)
                .order('changed_at', { ascending: false })
                .limit(1)
                .single()

            if (healthLog) {
                const dueDate = new Date()
                dueDate.setDate(dueDate.getDate() + 30) // 30 days from now

                const { error: followUpError } = await supabase
                    .from('follow_up_tasks')
                    .insert({
                        tree_id: update.treeId,
                        health_log_id: healthLog.id,
                        due_date: dueDate.toISOString(),
                        status: 'pending',
                        notes: `Follow-up check for sick tree ${tree.code}`,
                    })

                if (followUpError) {
                    console.error('Failed to create follow-up task:', followUpError)
                }
            }
        }

        return { success: true }
    } catch (error) {
        console.error('[SERVER] Update tree health error:', error)
        return { error: 'Failed to update tree health' }
    }
}

/**
 * Get trees by lot with optional health filter
 */
export async function getTreesByLot(lotId: string, healthFilter?: string) {
    try {
        const supabase = await createServerClient()

        let query = supabase
            .from('trees')
            .select(`
                id,
                code,
                health_status,
                status,
                created_at,
                user_id
            `)
            .eq('order_id', lotId)
            .order('code')

        if (healthFilter && healthFilter !== 'all') {
            query = query.eq('health_status', healthFilter)
        }

        const { data, error } = await query

        if (error) {
            return { data: null, error: error.message }
        }

        return { data, error: null }
    } catch (error) {
        console.error('Get trees error:', error)
        return { data: null, error: 'Failed to fetch trees' }
    }
}

/**
 * Get health history for a tree
 */
export async function getTreeHealthHistory(treeId: string) {
    try {
        const supabase = await createServerClient()

        const { data, error } = await supabase
            .from('tree_health_logs')
            .select(`
                id,
                old_status,
                new_status,
                notes,
                treatment_details,
                changed_at,
                changed_by
            `)
            .eq('tree_id', treeId)
            .order('changed_at', { ascending: false })

        if (error) {
            return { data: null, error: error.message }
        }

        return { data, error: null }
    } catch (error) {
        console.error('Get health history error:', error)
        return { data: null, error: 'Failed to fetch health history' }
    }
}

/**
 * Get replacement tasks
 */
export async function getReplacementTasks(status?: string): Promise<{ data: ReplacementTask[] | null; error: string | null }> {
    try {
        const supabase = await createServerClient()

        let query = supabase
            .from('replacement_tasks')
            .select('*')
            .order('created_at', { ascending: false })

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) {
            return { data: null, error: error.message }
        }

        return { data: data as ReplacementTask[], error: null }
    } catch (error) {
        console.error('Get replacement tasks error:', error)
        return { data: null, error: 'Failed to fetch replacement tasks' }
    }
}

/**
 * Update replacement task status
 */
export async function updateReplacementTask(taskId: string, updates: Partial<ReplacementTask>) {
    try {
        const supabase = await createServerClient()

        const { error } = await supabase
            .from('replacement_tasks')
            .update(updates)
            .eq('id', taskId)

        if (error) {
            return { error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Update replacement task error:', error)
        return { error: 'Failed to update replacement task' }
    }
}
