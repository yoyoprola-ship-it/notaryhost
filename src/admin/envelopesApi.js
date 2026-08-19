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

export async function setEnvelopeRecipientLanguage(id, language) {
  return adminFetch(`/api/admin/envelopes/${id}/language`, { method: 'POST', body: { language } })
}

export async function getCurrentPromotion() {
  return adminFetch('/api/admin/envelopes/settings', { method: 'GET' })
}

export async function startNextPromotion() {
  return adminFetch('/api/admin/envelopes/settings/next-promotion', { method: 'POST' })
}

export async function markPromotionSent(ids) {
  return adminFetch('/api/admin/envelopes/mark-sent', { method: 'POST', body: { ids } })
}
