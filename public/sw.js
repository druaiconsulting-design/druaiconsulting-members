const CACHE_NAME = 'dru-ai-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
]

// Install — cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch strategy:
// - API calls, Supabase, Stripe, Bunny → always network (never cache)
// - Everything else → network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Always network for API / external services
  const isApi = url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('stripe.com') ||
    url.hostname.includes('bunnycdn.com') ||
    url.hostname.includes('b-cdn.net') ||
    url.hostname.includes('anthropic.com')

  if (isApi) {
    event.respondWith(fetch(request))
    return
  }

  // Network first, fall back to cache for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful GET responses
        if (request.method === 'GET' && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline fallback — serve cached version or app shell
        return caches.match(request).then(
          (cached) => cached || caches.match('/index.html')
        )
      })
  )
})

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'DRU AI', body: event.data.text() } }

  event.waitUntil(
    self.registration.showNotification(data.title || 'DRU AI Leadership Ecosystem™', {
      body:  data.body  || '',
      icon:  data.icon  || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      data:  data.url   ? { url: data.url } : {},
    })
  )
})

// Notification click — open the portal
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(target)
          return
        }
      }
      clients.openWindow(target)
    })
  )
})
