import {
    getChecklistsByQuarter,
    getChecklistByLotAndQuarter,
    updateChecklistItem,
    getLotsWithChecklistStatus,
    getChecklistProgress,
} from '../fieldChecklist'

// Mock Supabase client
// eqLeaf is shared so chained .eq().eq() works by including eq in each level
const eqLeaf = {
    order: jest.fn(() => ({ data: [], error: null })),
    single: jest.fn(() => ({ data: null, error: { code: 'PGRST116' } })),
    eq: jest.fn(() => eqLeaf), // supports multiple chained .eq() calls
}

jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => eqLeaf),
                order: jest.fn(() => ({ data: [], error: null })),
                neq: jest.fn(() => ({ data: [], error: null })),
                data: [], // for direct await without .eq()
                error: null,
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => ({
                        data: {
                            id: 'test-checklist-id',
                            lot_id: 'test-lot-id',
                            quarter: '2026-Q1',
                            checklist_items: [],
                            overall_status: 'pending',
                            due_date: '2026-03-31',
                        },
                        error: null,
                    })),
                })),
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => ({
                            data: {
                                id: 'test-checklist-id',
                                checklist_items: [],
                            },
                            error: null,
                        })),
                    })),
                })),
            })),
        })),
    })),
}))

describe('fieldChecklist actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getChecklistsByQuarter', () => {
        it('returns checklists for a specific quarter', async () => {
            const result = await getChecklistsByQuarter('2026-Q1')

            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
        })

        it('handles errors gracefully', async () => {
            // Mock error case
            const { createServiceRoleClient } = require('@/lib/supabase/server')
            createServiceRoleClient.mockImplementationOnce(() => ({
                from: jest.fn(() => ({
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            order: jest.fn(() => ({
                                data: null,
                                error: { message: 'Database error' },
                            })),
                        })),
                    })),
                })),
            }))

            const result = await getChecklistsByQuarter('2026-Q1')

            expect(result.error).toBe('Database error')
            expect(result.data).toBeNull()
        })
    })

    describe('getChecklistByLotAndQuarter', () => {
        it('creates new checklist if not found', async () => {
            const result = await getChecklistByLotAndQuarter('test-lot-id', '2026-Q1')

            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
            expect(result.data?.quarter).toBe('2026-Q1')
        })
    })

    describe('updateChecklistItem', () => {
        it('updates checklist item completion status', async () => {
            // Mock existing checklist
            const { createServiceRoleClient } = require('@/lib/supabase/server')
            createServiceRoleClient.mockImplementationOnce(() => ({
                from: jest.fn(() => ({
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            single: jest.fn(() => ({
                                data: {
                                    id: 'test-checklist-id',
                                    checklist_items: [
                                        {
                                            id: 'visit',
                                            label: 'Thăm vườn',
                                            completed: false,
                                            completed_by: null,
                                            completed_at: null,
                                            notes: '',
                                        },
                                    ],
                                },
                                error: null,
                            })),
                        })),
                    })),
                    update: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            select: jest.fn(() => ({
                                single: jest.fn(() => ({
                                    data: {
                                        id: 'test-checklist-id',
                                        checklist_items: [
                                            {
                                                id: 'visit',
                                                label: 'Thăm vườn',
                                                completed: true,
                                                completed_by: 'admin',
                                                completed_at: '2026-04-20T12:00:00.000Z',
                                                notes: '',
                                            },
                                        ],
                                    },
                                    error: null,
                                })),
                            })),
                        })),
                    })),
                })),
            }))

            const result = await updateChecklistItem('test-checklist-id', 'visit', {
                completed: true,
            })

            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
        })

        it('updates checklist item notes', async () => {
            const { createServiceRoleClient } = require('@/lib/supabase/server')
            createServiceRoleClient.mockImplementationOnce(() => ({
                from: jest.fn(() => ({
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            single: jest.fn(() => ({
                                data: {
                                    id: 'test-checklist-id',
                                    checklist_items: [
                                        {
                                            id: 'visit',
                                            label: 'Thăm vườn',
                                            completed: false,
                                            completed_by: null,
                                            completed_at: null,
                                            notes: '',
                                        },
                                    ],
                                },
                                error: null,
                            })),
                        })),
                    })),
                    update: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            select: jest.fn(() => ({
                                single: jest.fn(() => ({
                                    data: {
                                        id: 'test-checklist-id',
                                        checklist_items: [
                                            {
                                                id: 'visit',
                                                label: 'Thăm vườn',
                                                completed: false,
                                                completed_by: null,
                                                completed_at: null,
                                                notes: 'Test note',
                                            },
                                        ],
                                    },
                                    error: null,
                                })),
                            })),
                        })),
                    })),
                })),
            }))

            const result = await updateChecklistItem('test-checklist-id', 'visit', {
                notes: 'Test note',
            })

            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
        })
    })

    describe('getChecklistProgress', () => {
        it('calculates progress correctly', async () => {
            const { createServiceRoleClient } = require('@/lib/supabase/server')
            // getChecklistProgress queries 'lots' then 'field_checklists'
            createServiceRoleClient.mockImplementationOnce(() => ({
                from: jest.fn((table: string) => {
                    if (table === 'lots') {
                        return {
                            select: jest.fn(() => ({
                                data: [{ id: 'lot-1' }, { id: 'lot-2' }],
                                error: null,
                            })),
                        }
                    }
                    return {
                        select: jest.fn(() => ({
                            eq: jest.fn(() => ({
                                data: [
                                    {
                                        checklist_items: [
                                            { completed: true },
                                            { completed: true },
                                            { completed: true },
                                        ],
                                    },
                                    {
                                        checklist_items: [
                                            { completed: true },
                                            { completed: false },
                                            { completed: false },
                                        ],
                                    },
                                ],
                                error: null,
                            })),
                        })),
                    }
                }),
            }))

            const result = await getChecklistProgress('2026-Q1')

            expect(result.error).toBeNull()
            expect(result.data?.totalLots).toBe(2)
            expect(result.data?.completedLots).toBe(1)
            expect(result.data?.overallPercentage).toBe(50)
        })

        it('handles empty checklists', async () => {
            const { createServiceRoleClient } = require('@/lib/supabase/server')
            createServiceRoleClient.mockImplementationOnce(() => ({
                from: jest.fn((table: string) => {
                    if (table === 'lots') {
                        return {
                            select: jest.fn(() => ({ data: [], error: null })),
                        }
                    }
                    return {
                        select: jest.fn(() => ({
                            eq: jest.fn(() => ({ data: [], error: null })),
                        })),
                    }
                }),
            }))

            const result = await getChecklistProgress('2026-Q1')

            expect(result.error).toBeNull()
            expect(result.data?.totalLots).toBe(0)
            expect(result.data?.completedLots).toBe(0)
            expect(result.data?.overallPercentage).toBe(0)
        })
    })
})
