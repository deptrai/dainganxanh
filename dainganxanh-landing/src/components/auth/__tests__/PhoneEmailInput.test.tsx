/**
 * Component Tests: PhoneEmailInput
 *
 * [P0] Auth core UI — email/phone mode toggle, validation, submit, error display.
 * Uses @testing-library/react + jest-dom.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhoneEmailInput } from '../PhoneEmailInput'

// Silence framer-motion animations
jest.mock('framer-motion', () => ({
    motion: {
        p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
}))

const defaultProps = {
    mode: 'email' as const,
    value: '',
    onChange: jest.fn(),
    onModeChange: jest.fn(),
    onSubmit: jest.fn(),
}

function renderInput(props = {}) {
    return render(<PhoneEmailInput {...defaultProps} {...props} />)
}

beforeEach(() => {
    jest.clearAllMocks()
})

describe('[P0] PhoneEmailInput — rendering', () => {
    test('[P0] renders email input in email mode', () => {
        renderInput({ mode: 'email' })
        expect(screen.getByLabelText(/địa chỉ email/i)).toBeInTheDocument()
    })

    test('[P1] shows "Nhập email để nhận mã OTP" helper text', () => {
        renderInput({ mode: 'email', value: '' })
        expect(screen.getByText(/nhập email để nhận mã otp/i)).toBeInTheDocument()
    })

    test('[P1] renders submit button', () => {
        renderInput()
        expect(screen.getByRole('button', { name: /gửi mã otp/i })).toBeInTheDocument()
    })

    test('[P1] submit button is disabled when value is empty', () => {
        renderInput({ value: '' })
        expect(screen.getByRole('button', { name: /gửi mã otp/i })).toBeDisabled()
    })

    test('[P1] submit button is enabled when value is provided', () => {
        renderInput({ value: 'test@example.com' })
        expect(screen.getByRole('button', { name: /gửi mã otp/i })).not.toBeDisabled()
    })
})

describe('[P0] PhoneEmailInput — email validation', () => {
    test('[P0] calls onSubmit with valid email', async () => {
        const onSubmit = jest.fn()
        renderInput({ value: 'user@example.com', onSubmit })

        await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))

        expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    test('[P0] shows validation error for invalid email', async () => {
        const onSubmit = jest.fn()
        renderInput({ value: 'not-an-email', onSubmit })

        await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent(/email không hợp lệ/i)
        })
        expect(onSubmit).not.toHaveBeenCalled()
    })

    test('[P1] shows validation error for email without @', async () => {
        const onSubmit = jest.fn()
        renderInput({ value: 'userexample.com', onSubmit })

        await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))

        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(onSubmit).not.toHaveBeenCalled()
    })

    test('[P1] accepts standard email formats', async () => {
        const onSubmit = jest.fn()
        const emails = ['a@b.com', 'user+tag@domain.co.uk', 'test.email@subdomain.example.com']

        for (const email of emails) {
            onSubmit.mockClear()
            const { unmount } = renderInput({ value: email, onSubmit })
            await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))
            expect(onSubmit).toHaveBeenCalledTimes(1)
            unmount()
        }
    })
})

describe('[P0] PhoneEmailInput — phone validation', () => {
    test('[P0] calls onSubmit with valid Vietnam phone number', async () => {
        const onSubmit = jest.fn()
        renderInput({ mode: 'phone', value: '0912345678', onSubmit })

        await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))

        expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    test('[P0] shows error for invalid phone number', async () => {
        const onSubmit = jest.fn()
        renderInput({ mode: 'phone', value: '12345', onSubmit })

        await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent(/số điện thoại không hợp lệ/i)
        })
        expect(onSubmit).not.toHaveBeenCalled()
    })

    test('[P1] accepts +84 prefix format', async () => {
        const onSubmit = jest.fn()
        renderInput({ mode: 'phone', value: '+84912345678', onSubmit })

        await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))

        expect(onSubmit).toHaveBeenCalledTimes(1)
    })
})

describe('[P1] PhoneEmailInput — external error', () => {
    test('[P1] shows external error from parent', () => {
        renderInput({ error: 'Server error occurred', value: 'test@test.com' })
        expect(screen.getByRole('alert')).toHaveTextContent('Server error occurred')
    })

    test('[P1] external error takes precedence over helper text', () => {
        renderInput({ error: 'Email đã được đăng ký', value: 'taken@test.com' })
        expect(screen.queryByText(/nhập email/i)).not.toBeInTheDocument()
        expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    test('[P2] clears validation error on value change', async () => {
        const onChange = jest.fn()
        const { rerender } = renderInput({ value: 'bad', onChange })

        // Trigger validation error
        await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))
        expect(screen.getByRole('alert')).toBeInTheDocument()

        // Simulate onChange clears the error (rerender with new valid value)
        const input = screen.getByRole('textbox')
        await userEvent.clear(input)
        await userEvent.type(input, 'valid@test.com')

        // After typing, validation error should clear
        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        })
    })
})

describe('[P1] PhoneEmailInput — loading state', () => {
    test('[P1] shows loading spinner when loading', () => {
        renderInput({ loading: true, value: 'test@test.com' })
        expect(screen.getByText(/đang gửi/i)).toBeInTheDocument()
    })

    test('[P1] disables input when loading', () => {
        renderInput({ loading: true, value: 'test@test.com' })
        expect(screen.getByRole('textbox')).toBeDisabled()
    })

    test('[P1] submit button disabled when loading', () => {
        renderInput({ loading: true, value: 'test@test.com' })
        const btn = screen.getByRole('button', { name: /đang gửi/i })
        expect(btn).toBeDisabled()
    })
})

describe('[P2] PhoneEmailInput — accessibility', () => {
    test('[P2] input has id matching label for', () => {
        renderInput()
        const label = screen.getByText(/địa chỉ email/i)
        const input = screen.getByRole('textbox')
        expect(label).toHaveAttribute('for', input.id)
    })

    test('[P2] input has aria-invalid when error shown', async () => {
        renderInput({ value: 'bad-email' })
        await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))

        await waitFor(() => {
            expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
        })
    })

    test('[P2] input has aria-describedby pointing to error message', async () => {
        renderInput({ value: 'bad' })
        await userEvent.click(screen.getByRole('button', { name: /gửi mã otp/i }))

        await waitFor(() => {
            const input = screen.getByRole('textbox')
            const errorId = input.getAttribute('aria-describedby')
            expect(errorId).toBeTruthy()
            expect(document.getElementById(errorId!)).toBeInTheDocument()
        })
    })
})
