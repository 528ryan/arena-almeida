self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Arena Almeida', {
      body: data.body ?? '',
      icon: '/apple-icon',
      badge: '/icon',
      tag: 'ranking-update',
      renotify: true,
      data: { url: '/ranking' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow('/ranking')
    })
  )
})
