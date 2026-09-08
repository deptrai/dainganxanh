import { render, screen, fireEvent } from '@testing-library/react'
import { EcoTourismClient } from '../EcoTourismClient'

const lots = [
    { id: 'lot-1', name: 'Vườn A', region: 'Miền Bắc', images: [], priceFrom: 800000 },
    { id: 'lot-2', name: 'Vườn B', region: 'Miền Nam', images: [], priceFrom: 900000 },
    { id: 'lot-3', name: 'Vườn C', region: 'Miền Bắc', images: [], priceFrom: 850000 },
]

describe('EcoTourismClient', () => {
    test('renders all lots on "Tất cả" tab', () => {
        render(<EcoTourismClient lots={lots} />)
        expect(screen.getByText('Vườn A')).toBeInTheDocument()
        expect(screen.getByText('Vườn B')).toBeInTheDocument()
        expect(screen.getByText('Vườn C')).toBeInTheDocument()
    })

    test('filters lots by selected region', () => {
        render(<EcoTourismClient lots={lots} />)
        const mienBacBtn = screen.getByRole('button', { name: /Miền Bắc/i })
        fireEvent.click(mienBacBtn)

        expect(screen.getByText('Vườn A')).toBeInTheDocument()
        expect(screen.getByText('Vườn C')).toBeInTheDocument()
        expect(screen.queryByText('Vườn B')).not.toBeInTheDocument()
    })

    test('region matching is case-insensitive', () => {
        const mixedCase = [
            { id: 'lot-1', name: 'Vườn A', region: '  MIỀN BẮC  ', images: [], priceFrom: 800000 },
        ]
        render(<EcoTourismClient lots={mixedCase} />)
        const mienBacBtn = screen.getByRole('button', { name: /Miền Bắc/i })
        fireEvent.click(mienBacBtn)
        expect(screen.getByText('Vườn A')).toBeInTheDocument()
    })

    test('shows empty state when no lots', () => {
        render(<EcoTourismClient lots={[]} />)
        expect(screen.getByText(/Chưa có vườn nào mở phòng/i)).toBeInTheDocument()
    })

    test('shows empty state when filter yields no results', () => {
        render(<EcoTourismClient lots={lots} />)
        fireEvent.click(screen.getByRole('button', { name: /Miền Trung/i }))
        expect(screen.getByText(/Chưa có vườn nào mở phòng/i)).toBeInTheDocument()
    })
})
