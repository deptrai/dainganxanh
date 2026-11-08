import React from 'react'
import { screen } from '@testing-library/react'
import { useTranslations, useLocale } from 'next-intl'
import { renderWithIntl } from '../renderWithIntl'

function TestComponent() {
  const t = useTranslations('common')
  const locale = useLocale()
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="brand">{t('brand.name')}</span>
      <span data-testid="nav-home">{t('nav.home')}</span>
    </div>
  )
}

describe('renderWithIntl test helper', () => {
  it('renders with default Vietnamese (vi) catalog', () => {
    renderWithIntl(<TestComponent />)

    expect(screen.getByTestId('locale')).toHaveTextContent('vi')
    expect(screen.getByTestId('brand')).toHaveTextContent('Đại Ngàn Xanh')
    expect(screen.getByTestId('nav-home')).toHaveTextContent('Trang chủ')
  })

  it('renders with English (en) catalog when locale="en"', () => {
    renderWithIntl(<TestComponent />, { locale: 'en' })

    expect(screen.getByTestId('locale')).toHaveTextContent('en')
    expect(screen.getByTestId('brand')).toHaveTextContent('Đại Ngàn Xanh')
    expect(screen.getByTestId('nav-home')).toHaveTextContent('Home')
  })

  it('accepts custom messages overrides', () => {
    renderWithIntl(<TestComponent />, {
      locale: 'vi',
      messages: {
        common: {
          brand: { name: 'Custom Brand Name' },
          nav: { home: 'Trang nhà' },
        },
      },
    })

    expect(screen.getByTestId('brand')).toHaveTextContent('Custom Brand Name')
    expect(screen.getByTestId('nav-home')).toHaveTextContent('Trang nhà')
  })
})
