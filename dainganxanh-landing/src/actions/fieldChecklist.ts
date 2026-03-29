'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface ChecklistItem {
    id: string
    label: string
    completed: boolean
    completed_by: string | null
    completed_at: string | null
    notes: string
}

export interface FieldChecklist {
    id: string
    lot_id: string
    quarter: string
    checklist_items: ChecklistItem[]
    overall_status: 'pending' | 'in_progress' | 'completed'
    due_date: string
    completed_at: string | null
    created_at: string
    updated_at: string
}

export interface LotWithChecklist {
    lot_id: string
    lot_name: string
    lot_region: string
    checklist: FieldChecklist | null
    completion_percentage: number
}

// Default checklist template
const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
    {
        id: 'visit',
        label: 'Thăm vườn',
        completed: false,
        completed_by: null,
        completed_at: null,
        notes: '',
    },
    {
        id: 'photos',
        label: 'Chụp ảnh',
        completed: false,
        completed_by: null,
        completed_at: null,
        notes: '',
    },
    {
        id: 'health_check',
        label: 'Kiểm tra sức khỏe',
        completed: false,
        completed_by: null,
        completed_at: null,
        notes: '',
    },
    {
        id: 'upload_photos',
        label: 'Upload ảnh',
        completed: false,
        completed_by: null,
        completed_at: null,
        notes: '',
    },
    {
        id: 'update_status',
        label: 'Cập nhật status',
        completed: false,
        completed_by: null,
        completed_at: null,
        notes: '',
    },
]

// Quarter due dates
const QUARTER_DUE_DATES: Record<string, string> = {
    Q1: '03-31',
    Q2: '06-30',
    Q3: '09-30',
    Q4: '12-31',
}

/**
 * Calculate due date for a given quarter
 */
function calculateDueDate(quarter: string): string {
    const [year, q] = quarter.split('-')
    const monthDay = QUARTER_DUE_DATES[q]
    if (!monthDay) {
        throw new Error(`Invalid quarter: ${quarter}`)
    }
    return `${year}-${monthDay}`
}

/**
 * Calculate completion percentage from checklist items
 */
function calculateCompletionPercentage(items: ChecklistItem[]): number {
    if (items.length === 0) return 0
    const completed = items.filter((item) => item.completed).length
    return Math.round((completed / items.length) * 100)
}

/**
 * Determine overall status based on completion percentage
 */
function determineOverallStatus(
    percentage: number
): 'pending' | 'in_progress' | 'completed' {
    if (percentage === 0) return 'pending'
    if (percentage === 100) return 'completed'
    return 'in_progress'
}

/**
 * Get checklists for a specific quarter
 */
export async function getChecklistsByQuarter(quarter: string) {
    try {
        const supabase = createServiceRoleClient()

        const { data, error } = await supabase
            .from('field_checklists')
            .select('*')
            .eq('quarter', quarter)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { data: data as FieldChecklist[], error: null }
    } catch (error) {
        console.error('Error fetching checklists by quarter:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unknown error',
        }
    }
}

/**
 * Get checklist for a specific lot and quarter
 * Creates one if it doesn't exist
 */
export async function getChecklistByLotAndQuarter(
    lotId: string,
    quarter: string
) {
    try {
        const supabase = createServiceRoleClient()

        // Try to find existing checklist
        const { data: existing, error: fetchError } = await supabase
            .from('field_checklists')
            .select('*')
            .eq('lot_id', lotId)
            .eq('quarter', quarter)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = not found, which is OK
            throw fetchError
        }

        if (existing) {
            return { data: existing as FieldChecklist, error: null }
        }

        // Create new checklist if not found
        const dueDate = calculateDueDate(quarter)
        const { data: newChecklist, error: insertError } = await supabase
            .from('field_checklists')
            .insert({
                lot_id: lotId,
                quarter,
                checklist_items: DEFAULT_CHECKLIST_ITEMS,
                overall_status: 'pending',
                due_date: dueDate,
            })
            .select()
            .single()

        if (insertError) throw insertError

        return { data: newChecklist as FieldChecklist, error: null }
    } catch (error) {
        console.error('Error getting checklist by lot and quarter:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unknown error',
        }
    }
}

/**
 * Update a checklist item (toggle complete, add notes)
 */
export async function updateChecklistItem(
    checklistId: string,
    itemId: string,
    updates: { completed?: boolean; notes?: string }
) {
    try {
        const supabase = createServiceRoleClient()

        // Get current checklist
        const { data: checklist, error: fetchError } = await supabase
            .from('field_checklists')
            .select('*')
            .eq('id', checklistId)
            .single()

        if (fetchError) throw fetchError

        // Update the specific item
        const items = checklist.checklist_items as ChecklistItem[]
        const updatedItems = items.map((item) => {
            if (item.id === itemId) {
                const updated = { ...item }
                if (updates.completed !== undefined) {
                    updated.completed = updates.completed
                    updated.completed_at = updates.completed
                        ? new Date().toISOString()
                        : null
                    // TODO: Get actual user ID from auth
                    updated.completed_by = updates.completed ? 'admin' : null
                }
                if (updates.notes !== undefined) {
                    updated.notes = updates.notes
                }
                return updated
            }
            return item
        })

        // Calculate new completion percentage and status
        const completionPercentage = calculateCompletionPercentage(updatedItems)
        const overallStatus = determineOverallStatus(completionPercentage)
        const completedAt =
            overallStatus === 'completed' ? new Date().toISOString() : null

        // Update checklist
        const { data, error: updateError } = await supabase
            .from('field_checklists')
            .update({
                checklist_items: updatedItems,
                overall_status: overallStatus,
                completed_at: completedAt,
            })
            .eq('id', checklistId)
            .select()
            .single()

        if (updateError) throw updateError

        return { data: data as FieldChecklist, error: null }
    } catch (error) {
        console.error('Error updating checklist item:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unknown error',
        }
    }
}

/**
 * Get all lots with their checklist status for a quarter
 */
export async function getLotsWithChecklistStatus(quarter: string) {
    try {
        const supabase = createServiceRoleClient()

        // Get all lots
        const { data: lots, error: lotsError } = await supabase
            .from('lots')
            .select('id, name, region')
            .order('name')

        if (lotsError) throw lotsError

        // Get checklists for this quarter
        const { data: checklists, error: checklistsError } = await supabase
            .from('field_checklists')
            .select('*')
            .eq('quarter', quarter)

        if (checklistsError) throw checklistsError

        // Map checklists to lots
        const checklistMap = new Map(
            (checklists as FieldChecklist[]).map((c) => [c.lot_id, c])
        )

        // Auto-create checklists for lots that don't have them
        const lotsWithChecklists: LotWithChecklist[] = []

        for (const lot of lots) {
            let checklist: FieldChecklist | null = checklistMap.get(lot.id) ?? null

            // If no checklist exists, create one
            if (!checklist) {
                const dueDate = calculateDueDate(quarter)
                const { data: newChecklist, error: createError } = await supabase
                    .from('field_checklists')
                    .insert({
                        lot_id: lot.id,
                        quarter,
                        checklist_items: DEFAULT_CHECKLIST_ITEMS,
                        overall_status: 'pending',
                        due_date: dueDate,
                    })
                    .select()
                    .single()

                if (createError) {
                    console.error('Error creating checklist for lot:', lot.id, createError)
                    // Continue with null checklist rather than failing entirely
                    checklist = null
                } else {
                    checklist = newChecklist as FieldChecklist
                }
            }

            const completionPercentage = checklist
                ? calculateCompletionPercentage(checklist.checklist_items)
                : 0

            lotsWithChecklists.push({
                lot_id: lot.id,
                lot_name: lot.name,
                lot_region: lot.region,
                checklist,
                completion_percentage: completionPercentage,
            })
        }

        return { data: lotsWithChecklists, error: null }
    } catch (error) {
        console.error('Error getting lots with checklist status:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unknown error',
        }
    }
}

/**
 * Get checklist progress for a quarter
 */
export async function getChecklistProgress(quarter: string) {
    try {
        const supabase = createServiceRoleClient()

        // Get total number of lots
        const { data: lots, error: lotsError } = await supabase
            .from('lots')
            .select('id')

        if (lotsError) throw lotsError

        const totalLots = lots?.length || 0

        // Get checklists for this quarter
        const { data: checklists, error: checklistsError } = await supabase
            .from('field_checklists')
            .select('checklist_items')
            .eq('quarter', quarter)

        if (checklistsError) throw checklistsError

        if (!checklists || checklists.length === 0) {
            return {
                data: {
                    totalLots,
                    completedLots: 0,
                    overallPercentage: 0,
                },
                error: null,
            }
        }

        const completedLots = checklists.filter((c) => {
            const items = c.checklist_items as ChecklistItem[]
            return items.every((item) => item.completed)
        }).length

        const overallPercentage = totalLots > 0 ? Math.round((completedLots / totalLots) * 100) : 0

        return {
            data: {
                totalLots,
                completedLots,
                overallPercentage,
            },
            error: null,
        }
    } catch (error) {
        console.error('Error getting checklist progress:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unknown error',
        }
    }
}
