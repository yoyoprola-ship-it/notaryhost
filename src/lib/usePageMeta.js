import { useEffect } from 'react'

const SITE_NAME = 'NotaryHost'
const DEFAULT_IMAGE = 'https://notaryhost.com/notaryhost-banner.jpg'

function setMetaByAttr(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url) {
  if (!url) return
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

function setStructuredData(data) {
  const existing = document.getElementById('page-structured-data')
  if (existing) existing.remove()
  if (!data) return
  const script = document.createElement('script')
  script.id = 'page-structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

// Sets document.title, description, Open Graph/Twitter tags, canonical URL,
// and JSON-LD per route. This only affects what JS-executing crawlers (like
// Googlebot) see — index.html's static tags remain what non-JS link-preview
// bots see for every route, since this stays a client-rendered SPA.
export default function usePageMeta({ title, description, url, image, type = 'website', structuredData }) {
  useEffect(() => {
    if (title) document.title = title
    setMetaByAttr('name', 'description', description)
    setMetaByAttr('property', 'og:site_name', SITE_NAME)
    setMetaByAttr('property', 'og:type', type)
    setMetaByAttr('property', 'og:title', title)
    setMetaByAttr('property', 'og:description', description)
    setMetaByAttr('property', 'og:url', url)
    setMetaByAttr('property', 'og:image', image || DEFAULT_IMAGE)
    setMetaByAttr('name', 'twitter:card', 'summary_large_image')
    setMetaByAttr('name', 'twitter:title', title)
    setMetaByAttr('name', 'twitter:description', description)
    setMetaByAttr('name', 'twitter:image', image || DEFAULT_IMAGE)
    setCanonical(url)
    setStructuredData(structuredData)
  }, [title, description, url, image, type, structuredData])
}
