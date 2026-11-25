/**
 * Unit Tests: AdminRoomsPage
 */

import { redirect } from '@/i18n/navigation'
import AdminRoomsPage from '../page'

const mockGetUser = jest.fn()
const mockServiceFrom = jest.fn()

jest.mock('@/i18n/navigation', () => ({
  redirect: jest.fn((target: any) => {
    const url = typeof target === 'string' ? target : target.href
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
  Link: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/crm/admin/rooms',
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser } })
  ),
  createServiceRoleClient: jest.fn(() => ({ from: mockServiceFrom })),
}))

jest.mock('@/components/admin/RoomCalendarClient', () => {
  return function MockRoomCalendarClient() {
    return <div data-testid="room-calendar" />
  }
})

function makeQueryChain(resolveValue: any) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(resolveValue)),
    then: (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(resolveValue).catch(reject),
  }
  return chain
}

describe('AdminRoomsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects unauthenticated users to login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    await expect(AdminRoomsPage()).rejects.toThrow('NEXT_REDIRECT: /auth/login')
  })

  it('redirects non-admin users to my-bookings', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(makeQueryChain({ data: { role: 'user' }, error: null }))

    await expect(AdminRoomsPage()).rejects.toThrow('NEXT_REDIRECT: /crm/my-bookings')
  })

  it('renders calendar for admin role', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockServiceFrom.mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))

    const result = await AdminRoomsPage()
    expect(result).toBeTruthy()
  })
})
