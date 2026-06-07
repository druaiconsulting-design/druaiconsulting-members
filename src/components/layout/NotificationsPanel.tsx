import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { navigate } from '../../lib/router'
import { useAuth } from '../../context/AuthContext'

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
  onUnreadChange: (count: number) => void
}

interface Notif {
  id: string
  sender_id: string | null
  post_id: string | null
  type: string
  message: string
  is_read: boolean
  created_at: string
}

interface SenderProfile {
  id: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)       return 'just now'
  if (s < 3600)     return `${Math.floor(s / 60)}m ago`
  if (s < 86400)    return `${Math.floor(s / 3600)}h ago`
  if (s < 604800)   return `${Math.floor(s / 86400)}d ago`
  if (s < 2592000)  return `${Math.floor(s / 604800)}w ago`
  return `${Math.floor(s / 2592000)}mo ago`
}

export default function NotificationsPanel({ isOpen, onClose, onUnreadChange }: NotificationsPanelProps) {
  const { profile } = useAuth()
  const [tab,     setTab]     = useState<'all' | 'unread'>('all')
  const [notifs,  setNotifs]  = useState<Notif[]>([])
  const [senders, setSenders] = useState<Record<string, SenderProfile>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && profile?.id) fetchNotifs()
  }, [isOpen, profile?.id])

  const fetchNotifs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('community_notifications')
      .select('*')
      .eq('recipient_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(30)

    const list = data ?? []
    setNotifs(list)

    // Fetch sender profiles in one query
    const ids = [...new Set(list.filter(n => n.sender_id).map(n => n.sender_id as string))]
    if (ids.length > 0) {
      const { data: sd } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, photo_url')
        .in('id', ids)
      const map: Record<string, SenderProfile> = {}
      sd?.forEach(s => { map[s.id] = s })
      setSenders(map)
    }

    onUnreadChange(list.filter(n => !n.is_read).length)
    setLoading(false)
  }

  const markAllRead = async () => {
    await supabase
      .from('community_notifications')
      .update({ is_read: true })
      .eq('recipient_id', profile!.id)
      .eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    onUnreadChange(0)
  }

  const markOneRead = async (id: string) => {
    await supabase.from('community_notifications').update({ is_read: true }).eq('id', id)
    const updated = notifs.map(n => n.id === id ? { ...n, is_read: true } : n)
    setNotifs(updated)
    onUnreadChange(updated.filter(n => !n.is_read).length)
  }

  const handleClick = async (notif: Notif) => {
    if (!notif.is_read) await markOneRead(notif.id)
    if (notif.post_id) navigate('/feed')
    onClose()
  }

  if (!isOpen) return null

  const displayed = tab === 'unread' ? notifs.filter(n => !n.is_read) : notifs

  // ── Icon helpers ────────────────────────────────────────────
  const IconMarkAll = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="1 12 5 16 13 8"/><polyline points="9 12 13 16 21 8"/>
    </svg>
  )
  const IconExpand = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
  const IconSettings = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 149 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 'var(--members-topnav-h, 100px)', right: 14,
        width: 360,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 12,
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        zIndex: 150, overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 0',
        }}>
          <span style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
            fontSize: 15, color: '#0A2342',
          }}>
            Notifications
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {[
              { icon: <IconMarkAll />, title: 'Mark all as read', action: markAllRead },
              { icon: <IconExpand />,  title: 'Open full page',   action: () => { navigate('/notifications'); onClose() } },
              { icon: <IconSettings />, title: 'Settings',        action: onClose },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                title={btn.title}
                style={{
                  padding: 6, color: '#8AA4C8', borderRadius: 6,
                  lineHeight: 0, transition: 'all 0.15s',
                }}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', padding: '8px 16px 0',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}>
          {(['all', 'unread'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px 10px', marginBottom: -1,
                fontFamily: 'Montserrat, sans-serif', fontSize: 12,
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? '#0A2342' : '#8AA4C8',
                borderBottom: tab === t ? '2px solid #0A2342' : '2px solid transparent',
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37',
                animation: 'notifSpin 0.7s linear infinite',
              }} />
            </div>

          ) : displayed.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#8AA4C8' }}>
                {tab === 'unread' ? "You're all caught up!" : 'No notifications yet.'}
              </p>
            </div>

          ) : displayed.map(notif => {
            const sender   = notif.sender_id ? senders[notif.sender_id] : null
            const fullName = sender ? [sender.first_name, sender.last_name].filter(Boolean).join(' ') : null
            const initials = fullName
              ? fullName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              : '?'

            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 16px', cursor: 'pointer',
                  background: notif.is_read ? 'transparent' : 'rgba(212,175,55,0.03)',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  position: 'relative', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9F8F5')}
                onMouseLeave={e => (e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(212,175,55,0.03)')}
              >
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #1e3d6e, #0A2342)',
                  border: '1.5px solid rgba(212,175,55,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {sender?.photo_url
                    ? <img src={sender.photo_url} alt={fullName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: '#D4AF37' }}>{initials}</span>
                  }
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 13,
                    color: '#0A2342', lineHeight: 1.45,
                  }}>
                    {notif.message}
                  </p>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 11,
                    color: '#8AA4C8', marginTop: 4,
                  }}>
                    {timeAgo(notif.created_at)}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#1a73e8', flexShrink: 0, marginTop: 6,
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`@keyframes notifSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
