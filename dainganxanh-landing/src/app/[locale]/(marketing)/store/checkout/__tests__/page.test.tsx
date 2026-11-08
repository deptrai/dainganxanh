import StoreCheckoutPage from '../page'
import { getEffectiveUser } from '@/lib/getEffectiveUser'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { StoreCheckoutClient } from '@/components/store/StoreCheckoutClient'

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}))
jest.mock('@/lib/getEffectiveUser', () => ({
  getEffectiveUser: jest.fn(),
}))
jest.mock('@/components/store/StoreCheckoutClient', () => ({
  StoreCheckoutClient: jest.fn(() => null),
}))

const mockGetEffectiveUser = getEffectiveUser as jest.Mock
const mockCreateServiceRoleClient = createServiceRoleClient as jest.Mock
const mockStoreCheckoutClient = StoreCheckoutClient as unknown as jest.Mock

const mockSingle = jest.fn()

function setupSupabase(product: object | null) {
  mockSingle.mockResolvedValue({ data: product, error: null })
  const eq2 = jest.fn(() => ({ single: mockSingle }))
  const eq1 = jest.fn(() => ({ eq: eq2 }))
  const select = jest.fn(() => ({ eq: eq1 }))
  mockCreateServiceRoleClient.mockReturnValue({ from: jest.fn(() => ({ select })) })
}

const product = {
  id: 'prod-1',
  name: 'Vòng tay Trầm Hương',
  slug: 'vong-tay-tram-huong',
  price: 200000,
  stock_quantity: 10,
  images: [],
}

describe('StoreCheckoutPage (SSR)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupSupabase(product)
  })

  it('passes prefill name+email to StoreCheckoutClient for authenticated user', async () => {
    mockGetEffectiveUser.mockResolvedValue({
      userId: 'u1',
      email: 'b@example.com',
      name: 'Nguyễn Văn B',
      isImpersonating: false,
    })

    const element = await StoreCheckoutPage({
      searchParams: Promise.resolve({ slug: 'vong-tay-tram-huong', quantity: '2' }),
    })

    expect(element.type).toBe(mockStoreCheckoutClient)
    expect(element.props.prefill).toEqual({ name: 'Nguyễn Văn B', email: 'b@example.com' })
    expect(element.props.quantity).toBe(2)
  })

  it('passes prefill undefined for guest (getEffectiveUser null)', async () => {
    mockGetEffectiveUser.mockResolvedValue(null)

    const element = await StoreCheckoutPage({
      searchParams: Promise.resolve({ slug: 'vong-tay-tram-huong', quantity: '1' }),
    })

    expect(element.props.prefill).toBeUndefined()
  })

  it('passes prefill undefined when getEffectiveUser rejects', async () => {
    mockGetEffectiveUser.mockRejectedValue(new Error('auth down'))

    const element = await StoreCheckoutPage({
      searchParams: Promise.resolve({ slug: 'vong-tay-tram-huong', quantity: '1' }),
    })

    expect(element.props.prefill).toBeUndefined()
  })
})
