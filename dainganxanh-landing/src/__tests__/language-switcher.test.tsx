import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageSwitcher, isAnyFormDirty, resetDirty, buildLocaleCookie } from '@/components/LanguageSwitcher'

const mockReplace = jest.fn()
const mockPathname = '/store'
let mockSearchParams = ''
let mockCurrentLocale = 'vi'

jest.mock('next-intl', () => ({
  useLocale: () => mockCurrentLocale,
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'switcher.ariaLabel': 'Switch language',
      'switcher.vi': 'Tiếng Việt',
      'switcher.en': 'English',
      'switcher.dirtyFormWarning': 'You have unsaved changes. Are you sure you want to switch language?',
    }
    return translations[key] ?? key
  },
}))

jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
}))

jest.mock('next/navigation', () => ({
  useSearchParams: () => (mockSearchParams ? new URLSearchParams(mockSearchParams) : null),
}))

const mockUpdateUserLocale = jest.fn().mockResolvedValue({ success: true })
jest.mock('@/actions/userLocale', () => ({
  updateUserLocale: (locale: string) => mockUpdateUserLocale(locale),
}))

describe('LanguageSwitcher Component & Dirty-Form Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetDirty()
    mockCurrentLocale = 'vi'
    mockSearchParams = ''
    document.body.innerHTML = ''
    document.cookie = ''
    window.confirm = jest.fn().mockReturnValue(true)
  })

  it('renders switch buttons for VI and EN with accessible labels from translations', () => {
    render(<LanguageSwitcher />)

    const viButton = screen.getByRole('button', { name: 'Tiếng Việt' })
    const enButton = screen.getByRole('button', { name: 'English' })

    expect(viButton).toBeInTheDocument()
    expect(enButton).toBeInTheDocument()
    expect(viButton).toHaveAttribute('aria-pressed', 'true')
    expect(enButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches to English when EN is clicked without dirty forms', () => {
    render(<LanguageSwitcher />)

    const enButton = screen.getByRole('button', { name: 'English' })
    fireEvent.click(enButton)

    expect(window.confirm).not.toHaveBeenCalled()
    expect(document.cookie).toContain('NEXT_LOCALE=en')
    expect(mockUpdateUserLocale).toHaveBeenCalledWith('en')
    expect(mockReplace).toHaveBeenCalledWith('/store', { locale: 'en' })
  })

  it('preserves query parameters when switching languages', () => {
    mockSearchParams = 'tab=orders&page=2'
    render(<LanguageSwitcher />)

    const enButton = screen.getByRole('button', { name: 'English' })
    fireEvent.click(enButton)

    expect(mockReplace).toHaveBeenCalledWith('/store?tab=orders&page=2', { locale: 'en' })
  })

  it('does nothing when clicking the already active language', () => {
    render(<LanguageSwitcher />)

    const viButton = screen.getByRole('button', { name: 'Tiếng Việt' })
    fireEvent.click(viButton)

    expect(window.confirm).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockUpdateUserLocale).not.toHaveBeenCalled()
  })

  it('prompts confirm() when a form has registered input events', () => {
    render(<LanguageSwitcher />)

    const input = document.createElement('input')
    document.body.appendChild(input)

    expect(isAnyFormDirty()).toBe(false)
    fireEvent.input(input, { target: { value: 'User typed something' } })
    expect(isAnyFormDirty()).toBe(true)

    // User confirms
    ;(window.confirm as jest.Mock).mockReturnValue(true)

    const enButton = screen.getByRole('button', { name: 'English' })
    fireEvent.click(enButton)

    expect(window.confirm).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to switch language?'
    )
    expect(mockReplace).toHaveBeenCalledWith('/store', { locale: 'en' })
  })

  it('cancels language switch when user rejects the confirmation dialog', () => {
    render(<LanguageSwitcher />)

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    fireEvent.change(textarea, { target: { value: 'Modified text' } })
    expect(isAnyFormDirty()).toBe(true)

    // User cancels
    ;(window.confirm as jest.Mock).mockReturnValue(false)

    const enButton = screen.getByRole('button', { name: 'English' })
    fireEvent.click(enButton)

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockUpdateUserLocale).not.toHaveBeenCalled()
  })

  it('appends "; Secure" cookie flag when protocol is https:', () => {
    const secureCookie = buildLocaleCookie('en', 'https:')
    expect(secureCookie).toContain('NEXT_LOCALE=en')
    expect(secureCookie).toContain('; Secure')

    const insecureCookie = buildLocaleCookie('en', 'http:')
    expect(insecureCookie).toContain('NEXT_LOCALE=en')
    expect(insecureCookie).not.toContain('; Secure')
  })
})
