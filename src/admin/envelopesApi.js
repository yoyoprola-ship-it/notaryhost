import { adminFetch } from './apiClient'

export async function listEnvelopeRecipients() {
  return adminFetch('/api/admin/envelopes', { method: 'GET' })
}

export async function addEnvelopeRecipient(name, address) {
  return adminFetch('/api/admin/envelopes', { method: 'POST', body: { name, address } })
}

export async function deleteEnvelopeRecipient(id) {
  return adminFetch(`/api/admin/envelopes/${id}`, { method: 'DELETE' })
}
