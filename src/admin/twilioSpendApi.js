import { adminFetch } from './apiClient'

export async function getTwilioSpend() {
  return adminFetch('/api/admin/twilio-spend', { method: 'GET' })
}
