import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl as render } from '@/test-utils/renderWithIntl'
import CreateLotForm from '../CreateLotForm'
import EditLotForm from '../EditLotForm'

const mockCreateLot = jest.fn()
const mockUpdateLot = jest.fn()

jest.mock('@/actions/lots', () => ({
    createLot: (...args: any[]) => mockCreateLot(...args),
    updateLot: (...args: any[]) => mockUpdateLot(...args),
}))

describe('CreateLotForm and EditLotForm EN payload', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockCreateLot.mockResolvedValue({ success: true })
        mockUpdateLot.mockResolvedValue({ success: true })
    })

    describe('CreateLotForm', () => {
        it('includes regionEn in translations payload when submitted', async () => {
            const onClose = jest.fn()
            const onSuccess = jest.fn()

            render(<CreateLotForm onClose={onClose} onSuccess={onSuccess} />)

            // Fill VI required fields
            fireEvent.change(screen.getByPlaceholderText('Ví dụ: Lô A1 - Đồng Nai'), {
                target: { value: 'Lô A1' },
            })
            fireEvent.change(screen.getByPlaceholderText('Ví dụ: Đồng Nai, Bình Phước'), {
                target: { value: 'Đồng Nai' },
            })
            fireEvent.change(screen.getByPlaceholderText('1000'), {
                target: { value: '500' },
            })

            // Switch to EN tab
            fireEvent.click(screen.getByRole('button', { name: /tiếng anh/i }))

            // Fill EN fields
            fireEvent.change(screen.getByPlaceholderText('e.g. Lot A1 - Dong Nai'), {
                target: { value: 'Lot A1' },
            })
            fireEvent.change(screen.getByPlaceholderText('e.g. Dong Nai, Binh Phuoc'), {
                target: { value: 'Dong Nai Region' },
            })

            // Submit
            fireEvent.click(screen.getByRole('button', { name: /tạo lô/i }))

            await waitFor(() => {
                expect(mockCreateLot).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: 'Lô A1',
                        region: 'Đồng Nai',
                        total_trees: 500,
                        translations: {
                            en: {
                                name: 'Lot A1',
                                region: 'Dong Nai Region',
                            },
                        },
                    })
                )
            })
            expect(onSuccess).toHaveBeenCalled()
            expect(onClose).toHaveBeenCalled()
        })
    })

    describe('EditLotForm', () => {
        it('passes regionEn and direct input values in translations payload', async () => {
            const onClose = jest.fn()
            const onSuccess = jest.fn()

            const mockLot = {
                id: 'lot-123',
                name: 'Lô B2',
                region: 'Lâm Đồng',
                description: 'Mô tả lô',
                location_lat: 11.5,
                location_lng: 107.8,
                total_trees: 1000,
                planted: 100,
                translations: {
                    vi: { name: 'Lô B2', region: 'Lâm Đồng', description: 'Mô tả lô' },
                    en: { name: 'Lot B2 Old', region: 'Lam Dong Old', description: 'Old desc' },
                },
            }

            render(<EditLotForm lot={mockLot} onClose={onClose} onSuccess={onSuccess} />)

            // Switch to EN tab
            fireEvent.click(screen.getByRole('button', { name: /tiếng anh/i }))

            // Update region EN and clear description EN
            const regionInput = screen.getByPlaceholderText('e.g. Dong Nai, Binh Phuoc')
            fireEvent.change(regionInput, { target: { value: 'Lam Dong Highlands' } })

            const descInput = screen.getByPlaceholderText('Description in English...')
            fireEvent.change(descInput, { target: { value: '' } })

            // Submit
            fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

            await waitFor(() => {
                expect(mockUpdateLot).toHaveBeenCalledWith(
                    'lot-123',
                    expect.objectContaining({
                        translations: expect.objectContaining({
                            en: expect.objectContaining({
                                name: 'Lot B2 Old',
                                description: '',
                                region: 'Lam Dong Highlands',
                            }),
                        }),
                    })
                )
            })
        })
    })
})
