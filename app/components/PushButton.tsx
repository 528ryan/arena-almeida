'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export default function PushButton() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    checarStatus()
  }, [])

  async function checarStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied'); return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'unsubscribed')
    } catch {
      setStatus('unsubscribed')
    }
  }

  async function ativar() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })

      setStatus(res.ok ? 'subscribed' : 'unsubscribed')
    } catch {
      setStatus(Notification.permission === 'denied' ? 'denied' : 'unsubscribed')
    }
  }

  async function desativar() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('unsubscribed')
    } catch {
      setStatus('subscribed')
    }
  }

  if (status === 'unsupported') return null

  if (status === 'loading') {
    return (
      <div className="w-full py-3.5 rounded-2xl bg-gray-100 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Verificando notificações…
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="w-full py-3.5 rounded-2xl bg-gray-100 flex items-center justify-center gap-2 text-gray-400 text-sm font-semibold">
        <BellOff className="w-4 h-4" />
        Notificações bloqueadas no navegador
      </div>
    )
  }

  if (status === 'subscribed') {
    return (
      <button
        onClick={desativar}
        className="w-full py-3.5 rounded-2xl border-2 border-[#009C3B] text-[#009C3B] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <Bell className="w-4 h-4" />
        Notificações ativadas
      </button>
    )
  }

  return (
    <button
      onClick={ativar}
      className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
    >
      <Bell className="w-4 h-4" />
      Ativar notificações
    </button>
  )
}

