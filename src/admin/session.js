export const ADMIN_EMAIL = 'yoyoprola@gmail.com'

export function isAdminSession(user) {
  return !!user && user.email === ADMIN_EMAIL && user.emailVerified === true
}
