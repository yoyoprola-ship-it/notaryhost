import { adminFetch } from './apiClient'

export async function getSiteVisits() {
  return adminFetch('/api/site-visits', { method: 'GET' })
}

export async function getNotaryDashboard(notaryId) {
  return adminFetch(`/api/admin/notaries/${notaryId}/dashboard`, { method: 'GET' })
}

export async function cancelBooking(notaryId, bookingId) {
  return adminFetch(`/api/admin/notaries/${notaryId}/bookings/${bookingId}/cancel`, { method: 'PATCH' })
}

export async function markBillPaid(notaryId, period) {
  return adminFetch(`/api/admin/notaries/${notaryId}/bills/${period}/paid`, { method: 'PATCH' })
}

export async function saveHours(notaryId, hours) {
  return adminFetch(`/api/admin/notaries/${notaryId}/hours`, { method: 'PUT', body: hours })
}

export async function saveIvrConfig(notaryId, config) {
  return adminFetch(`/api/admin/notaries/${notaryId}/ivr`, { method: 'PUT', body: config })
}

export async function getNotaryPhoneLog(notaryId) {
  return adminFetch(`/api/admin/notaries/${notaryId}/phone`, { method: 'GET' })
}

export async function sendNotaryPhoneReply(notaryId, to, message) {
  return adminFetch(`/api/admin/notaries/${notaryId}/phone/reply`, { method: 'POST', body: { to, message } })
}
