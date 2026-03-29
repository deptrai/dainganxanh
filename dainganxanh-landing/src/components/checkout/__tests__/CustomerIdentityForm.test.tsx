import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerIdentityForm } from '@/components/checkout/CustomerIdentityForm'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            user_metadata: { full_name: 'Nguyễn Văn A' },
            email: 'test@example.com',
          },
        },
      }),
    },
  })),
}))

const mockOnSubmit = jest.fn().mockResolvedValue(undefined)

describe('CustomerIdentityForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders all required fields', async () => {
    render(<CustomerIdentityForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/họ và tên/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ngày sinh/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/quốc tịch/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/số cccd/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ngày cấp/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nơi cấp/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/địa chỉ/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/số điện thoại/i)).toBeInTheDocument()
  })

  it('defaults nationality to "Việt Nam"', () => {
    render(<CustomerIdentityForm onSubmit={mockOnSubmit} />)
    const nationalityInput = screen.getByLabelText(/quốc tịch/i)
    expect(nationalityInput).toHaveValue('Việt Nam')
  })

  it('shows error when CCCD is not 12 digits', async () => {
    render(<CustomerIdentityForm onSubmit={mockOnSubmit} />)

    const cccdInput = screen.getByLabelText(/số cccd/i)
    fireEvent.change(cccdInput, { target: { value: '12345' } })
    fireEvent.blur(cccdInput)

    await waitFor(() => {
      expect(screen.getByText(/12 chữ số/i)).toBeInTheDocument()
    })
  })

  it('shows error when phone number is invalid', async () => {
    render(<CustomerIdentityForm onSubmit={mockOnSubmit} />)

    const phoneInput = screen.getByLabelText(/số điện thoại/i)
    fireEvent.change(phoneInput, { target: { value: '123456789' } })
    fireEvent.blur(phoneInput)

    await waitFor(() => {
      expect(screen.getByText(/không hợp lệ/i)).toBeInTheDocument()
    })
  })

  it('shows errors for empty required fields on submit', async () => {
    render(<CustomerIdentityForm onSubmit={mockOnSubmit} />)
    const user = userEvent.setup()

    const submitBtn = screen.getByRole('button', { name: /tiếp tục/i })
    await user.click(submitBtn)

    // id_number is never pre-filled, so its error is always shown
    await waitFor(() => {
      expect(screen.getByText(/12 chữ số/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    render(<CustomerIdentityForm onSubmit={mockOnSubmit} />)
    const user = userEvent.setup()

    // Wait for async pre-fill to complete
    await waitFor(() => {
      expect(screen.getByLabelText(/họ và tên/i)).toHaveValue('Nguyễn Văn A')
    })

    // Date inputs need fireEvent.change in jsdom
    fireEvent.change(screen.getByLabelText(/ngày sinh/i), { target: { value: '1990-01-15' } })

    await user.type(screen.getByLabelText(/số cccd/i), '123456789012')

    fireEvent.change(screen.getByLabelText(/ngày cấp/i), { target: { value: '2015-06-01' } })

    await user.type(screen.getByLabelText(/nơi cấp/i), 'Cục Cảnh sát QLHC về TTXH')
    await user.type(screen.getByLabelText(/địa chỉ/i), '123 Đường ABC, Quận 1')
    await user.type(screen.getByLabelText(/số điện thoại/i), '0901234567')

    const submitBtn = screen.getByRole('button', { name: /tiếp tục/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Nguyễn Văn A',
          id_number: '123456789012',
          phone: '0901234567',
        })
      )
    })
  })

  it('pre-fills full_name from user metadata', async () => {
    render(<CustomerIdentityForm onSubmit={mockOnSubmit} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/họ và tên/i)).toHaveValue('Nguyễn Văn A')
    })
  })
})
