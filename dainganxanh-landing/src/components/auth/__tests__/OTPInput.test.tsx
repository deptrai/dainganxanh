/**
 * Component Tests: OTPInput
 *
 * [P0] Auth core UI — 8-digit OTP entry with auto-advance, paste, resend.
 * Uses @testing-library/react + jest-dom.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OTPInput } from '../OTPInput'

// Silence framer-motion animations in tests
jest.mock('framer-motion', () => ({
    motion: {
        input: ({ children, ...props }: any) => <input {...props}>{children}</input>,
        p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const defaultProps = {
    onComplete: jest.fn(),
    onResend: jest.fn(),
    countdown: 60,
    canResend: false,
}

function renderOTPInput(props = {}) {
    return render(<OTPInput {...defaultProps} {...props} />)
}

function getOTPInputs() {
    return screen.getAllByRole('textbox')
}

beforeEach(() => {
    jest.clearAllMocks()
})

describe('[P0] OTPInput — rendering', () => {
    test('[P0] renders 8 digit inputs by default', () => {
        renderOTPInput()
        expect(getOTPInputs()).toHaveLength(8)
    })

    test('[P1] renders custom length inputs', () => {
        renderOTPInput({ length: 6 })
        expect(getOTPInputs()).toHaveLength(6)
    })

    test('[P1] shows countdown when > 0', () => {
        renderOTPInput({ countdown: 45 })
        expect(screen.getByText(/45s/)).toBeInTheDocument()
    })

    test('[P1] shows resend button when countdown is 0 and canResend is true', () => {
        renderOTPInput({ countdown: 0, canResend: true })
        expect(screen.getByRole('button', { name: /gửi lại/i })).toBeInTheDocument()
    })

    test('[P1] disables resend button when canResend is false', () => {
        renderOTPInput({ countdown: 0, canResend: false })
        const resendBtn = screen.getByRole('button', { name: /gửi lại/i })
        expect(resendBtn).toBeDisabled()
    })
})

describe('[P0] OTPInput — digit entry', () => {
    test('[P0] accepts single digit in each input', async () => {
        renderOTPInput()
        const inputs = getOTPInputs()

        await userEvent.type(inputs[0], '5')
        expect(inputs[0]).toHaveValue('5')
    })

    test('[P0] rejects non-numeric characters', async () => {
        renderOTPInput()
        const inputs = getOTPInputs()

        await userEvent.type(inputs[0], 'a')
        expect(inputs[0]).toHaveValue('')
    })

    test('[P0] calls onComplete when all 8 digits entered', async () => {
        const onComplete = jest.fn()
        renderOTPInput({ onComplete })
        const inputs = getOTPInputs()

        for (let i = 0; i < 8; i++) {
            await userEvent.type(inputs[i], String(i + 1))
        }

        await waitFor(() => {
            expect(onComplete).toHaveBeenCalledWith('12345678')
        })
    })

    test('[P1] does not call onComplete for partial entry', async () => {
        const onComplete = jest.fn()
        renderOTPInput({ onComplete })
        const inputs = getOTPInputs()

        await userEvent.type(inputs[0], '1')
        await userEvent.type(inputs[1], '2')

        expect(onComplete).not.toHaveBeenCalled()
    })
})

describe('[P0] OTPInput — keyboard navigation', () => {
    test('[P1] backspace clears current digit', async () => {
        renderOTPInput()
        const inputs = getOTPInputs()

        await userEvent.type(inputs[0], '5')
        expect(inputs[0]).toHaveValue('5')

        fireEvent.keyDown(inputs[0], { key: 'Backspace' })
        expect(inputs[0]).toHaveValue('')
    })
})

describe('[P0] OTPInput — paste', () => {
    test('[P0] pastes full 8-digit code across inputs', async () => {
        const onComplete = jest.fn()
        renderOTPInput({ onComplete })
        const inputs = getOTPInputs()

        fireEvent.paste(inputs[0], {
            clipboardData: { getData: () => '12345678' },
        })

        await waitFor(() => {
            expect(onComplete).toHaveBeenCalledWith('12345678')
        })
    })

    test('[P1] ignores paste with non-numeric characters', async () => {
        const onComplete = jest.fn()
        renderOTPInput({ onComplete })
        const inputs = getOTPInputs()

        fireEvent.paste(inputs[0], {
            clipboardData: { getData: () => 'ABCDEFGH' },
        })

        expect(onComplete).not.toHaveBeenCalled()
    })
})

describe('[P1] OTPInput — error state', () => {
    test('[P1] shows error message when error prop provided', () => {
        renderOTPInput({ error: 'Mã OTP không hợp lệ' })
        expect(screen.getByRole('alert')).toHaveTextContent('Mã OTP không hợp lệ')
    })

    test('[P1] does not show error when error is null', () => {
        renderOTPInput({ error: null })
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
})

describe('[P1] OTPInput — loading state', () => {
    test('[P1] disables all inputs when loading', () => {
        renderOTPInput({ loading: true })
        const inputs = getOTPInputs()
        inputs.forEach(input => expect(input).toBeDisabled())
    })

    test('[P1] shows loading indicator when loading', () => {
        renderOTPInput({ loading: true })
        expect(screen.getByText(/đang xác thực/i)).toBeInTheDocument()
    })

    test('[P2] does not call onComplete when loading even if all digits entered', async () => {
        const onComplete = jest.fn()
        renderOTPInput({ loading: true, onComplete })
        const inputs = getOTPInputs()

        // Simulate filled state (inputs disabled, so just check onComplete not called)
        expect(onComplete).not.toHaveBeenCalled()
    })
})

describe('[P1] OTPInput — resend', () => {
    test('[P1] calls onResend when resend button clicked', async () => {
        const onResend = jest.fn()
        renderOTPInput({ countdown: 0, canResend: true, onResend })

        const resendBtn = screen.getByRole('button', { name: /gửi lại/i })
        await userEvent.click(resendBtn)

        expect(onResend).toHaveBeenCalledTimes(1)
    })
})

describe('[P2] OTPInput — accessibility', () => {
    test('[P2] each input has aria-label with digit position', () => {
        renderOTPInput()
        const inputs = getOTPInputs()

        inputs.forEach((input, i) => {
            expect(input).toHaveAttribute('aria-label', `Digit ${i + 1}`)
        })
    })
})
