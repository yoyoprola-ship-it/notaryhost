const MAIN_HOSTS = ['notaryhost.com', 'www.notaryhost.com', 'localhost']

export function getTenantSlug(hostname = window.location.hostname) {
  if (MAIN_HOSTS.includes(hostname)) return null
  if (
    hostname.endsWith('.web.app') ||
    hostname.endsWith('.firebaseapp.com') ||
    hostname.endsWith('.hosted.app')
  ) {
    return null
  }
  if (!hostname.endsWith('.notaryhost.com')) return null
  return hostname.split('.')[0]
}
