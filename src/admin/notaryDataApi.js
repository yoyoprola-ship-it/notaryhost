import { adminFetch } from './apiClient'

export async function getNotaryDashboard(notaryId) {
  return adminFetch(`/api/admin/notaries/${notaryId}/dashboard`, { method: 'GET' })
}
