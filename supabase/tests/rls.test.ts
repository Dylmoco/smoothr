import { describe, it, expect } from 'vitest'

interface User { id: string; role?: string }
interface UserStore { store_id: string; customer_id: string; role: string }
interface Order { id: string; store_id: string; customer_id: string; paid_at: string | null }
interface StoreIntegration { store_id: string }

function isAdmin(user: User, storeId: string, userStores: UserStore[]): boolean {
  return userStores.some(u => u.store_id === storeId && u.customer_id === user.id && u.role === 'admin')
}

function orders_customer_select_insert(order: Order, user: User) {
  return order.customer_id === user.id
}

function orders_customer_unpaid_modify(order: Order, user: User) {
  return order.customer_id === user.id && order.paid_at === null
}

function orders_admin_service_modify(order: Order, user: User, userStores: UserStore[]) {
  return user.role === 'service_role' || isAdmin(user, order.store_id, userStores)
}

function store_integrations_service_role_admin_select(rec: StoreIntegration, user: User, userStores: UserStore[]) {
  return user.role === 'service_role' || isAdmin(user, rec.store_id, userStores)
}

describe('RLS policy simulation', () => {
  const customer: User = { id: 'c1' }
  const admin: User = { id: 'a1' }
  const service: User = { id: 'svc', role: 'service_role' }
  const userStores: UserStore[] = [{ store_id: 's1', customer_id: 'a1', role: 'admin' }]

  const unpaidOrder: Order = { id: 'o1', store_id: 's1', customer_id: 'c1', paid_at: null }
  const paidOrder: Order = { id: 'o2', store_id: 's1', customer_id: 'c1', paid_at: '2024-01-01' }

  it('customer can read own order', () => {
    expect(orders_customer_select_insert(unpaidOrder, customer)).toBe(true)
  })

  it('customer cannot read others order', () => {
    expect(orders_customer_select_insert({ ...unpaidOrder, customer_id: 'c2' }, customer)).toBe(false)
  })

  it('customer can update unpaid order', () => {
    expect(orders_customer_unpaid_modify(unpaidOrder, customer)).toBe(true)
  })

  it('customer cannot update paid order', () => {
    expect(orders_customer_unpaid_modify(paidOrder, customer)).toBe(false)
  })

  it('admin can update any order', () => {
    expect(orders_admin_service_modify(paidOrder, admin, userStores)).toBe(true)
  })

  it('service role can update any order', () => {
    expect(orders_admin_service_modify(paidOrder, service, [])).toBe(true)
  })

  it('non-admin cannot read store integrations', () => {
    expect(store_integrations_service_role_admin_select({ store_id: 's1' }, customer, userStores)).toBe(false)
  })

  it('admin can read store integrations', () => {
    expect(store_integrations_service_role_admin_select({ store_id: 's1' }, admin, userStores)).toBe(true)
  })
})
