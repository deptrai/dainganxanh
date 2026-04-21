import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChecklistItem } from '../ChecklistItem'
import type { ChecklistItem as ChecklistItemType } from '@/actions/fieldChecklist'

describe('ChecklistItem', () => {
    const mockItem: ChecklistItemType = {
        id: 'visit',
        label: 'Thăm vườn',
        completed: false,
        completed_by: null,
        completed_at: null,
        notes: '',
    }

    const mockOnToggle = jest.fn().mockResolvedValue(undefined)
    const mockOnNotesChange = jest.fn().mockResolvedValue(undefined)

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders checklist item with label', () => {
        render(
            <ChecklistItem
                item={mockItem}
                checklistId="test-checklist-id"
                onToggle={mockOnToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        expect(screen.getByText('Thăm vườn')).toBeInTheDocument()
    })

    it('shows unchecked checkbox when item is not completed', () => {
        render(
            <ChecklistItem
                item={mockItem}
                checklistId="test-checklist-id"
                onToggle={mockOnToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        const buttons = screen.getAllByRole('button')
        const checkbox = buttons[0] // First button is the checkbox
        expect(checkbox).toHaveClass('border-gray-300')
    })

    it('shows checked checkbox when item is completed', () => {
        const completedItem = {
            ...mockItem,
            completed: true,
            completed_by: 'admin',
            completed_at: '2026-04-20T12:00:00.000Z',
        }

        render(
            <ChecklistItem
                item={completedItem}
                checklistId="test-checklist-id"
                onToggle={mockOnToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        const buttons = screen.getAllByRole('button')
        const checkbox = buttons[0] // First button is the checkbox
        expect(checkbox).toHaveClass('bg-green-500')
    })

    it('calls onToggle when checkbox is clicked', async () => {
        render(
            <ChecklistItem
                item={mockItem}
                checklistId="test-checklist-id"
                onToggle={mockOnToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        const buttons = screen.getAllByRole('button')
        const checkbox = buttons[0] // First button is the checkbox
        fireEvent.click(checkbox)

        await waitFor(() => {
            expect(mockOnToggle).toHaveBeenCalledWith('visit', true)
        })
    })

    it('shows loading state during toggle', async () => {
        jest.useFakeTimers()
        const slowToggle = jest.fn(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        )

        render(
            <ChecklistItem
                item={mockItem}
                checklistId="test-checklist-id"
                onToggle={slowToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        const buttons = screen.getAllByRole('button')
        const checkbox = buttons[0] // First button is the checkbox
        fireEvent.click(checkbox)

        // Should show loading spinner
        expect(checkbox).toHaveClass('opacity-50')

        jest.runAllTimers()
        await waitFor(() => {
            expect(slowToggle).toHaveBeenCalled()
        })
        jest.useRealTimers()
    })

    it('displays completed_by and completed_at when item is completed', () => {
        const completedItem = {
            ...mockItem,
            completed: true,
            completed_by: 'admin',
            completed_at: '2026-01-14T10:00:00Z',
        }

        render(
            <ChecklistItem
                item={completedItem}
                checklistId="test-checklist-id"
                onToggle={mockOnToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        expect(screen.getByText(/Hoàn thành bởi admin/i)).toBeInTheDocument()
    })

    it('shows notes field when "Thêm ghi chú" is clicked', () => {
        render(
            <ChecklistItem
                item={mockItem}
                checklistId="test-checklist-id"
                onToggle={mockOnToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        const notesButton = screen.getByText('Thêm ghi chú')
        fireEvent.click(notesButton)

        expect(screen.getByPlaceholderText('Nhập ghi chú...')).toBeInTheDocument()
    })

    it('saves notes when "Lưu" is clicked', async () => {
        render(
            <ChecklistItem
                item={mockItem}
                checklistId="test-checklist-id"
                onToggle={mockOnToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        // Open notes field
        const notesButton = screen.getByText('Thêm ghi chú')
        fireEvent.click(notesButton)

        // Type notes
        const textarea = screen.getByPlaceholderText('Nhập ghi chú...')
        fireEvent.change(textarea, { target: { value: 'Test note' } })

        // Save notes
        const saveButton = screen.getByText('Lưu')
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(mockOnNotesChange).toHaveBeenCalledWith('visit', 'Test note')
        })
    })

    it('cancels notes editing when "Hủy" is clicked', () => {
        render(
            <ChecklistItem
                item={mockItem}
                checklistId="test-checklist-id"
                onToggle={mockOnToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        // Open notes field
        const notesButton = screen.getByText('Thêm ghi chú')
        fireEvent.click(notesButton)

        // Type notes
        const textarea = screen.getByPlaceholderText('Nhập ghi chú...')
        fireEvent.change(textarea, { target: { value: 'Test note' } })

        // Cancel
        const cancelButton = screen.getByText('Hủy')
        fireEvent.click(cancelButton)

        // Notes field should be hidden
        expect(screen.queryByPlaceholderText('Nhập ghi chú...')).not.toBeInTheDocument()
        expect(mockOnNotesChange).not.toHaveBeenCalled()
    })

    it('shows notes preview when item has notes', () => {
        const itemWithNotes = {
            ...mockItem,
            notes: 'Existing note',
        }

        render(
            <ChecklistItem
                item={itemWithNotes}
                checklistId="test-checklist-id"
                onToggle={mockOnToggle}
                onNotesChange={mockOnNotesChange}
            />
        )

        expect(screen.getByText(/📝 Existing note/i)).toBeInTheDocument()
    })
})
