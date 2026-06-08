import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { navigate } from '../lib/router'

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifTab = 'inbox' | 'mentions' | 'following' | 'all' | 'archived'

interface Notif {
  id: string
  sender_id: string | null
  post_id: string | null
  type: string
  message: string
  is_read: boolean
  is_archived: boolean
  created_at: string
}

interface SenderProfile {
  id: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)      return 'just now'
  if (s < 3600)    return `${Math.floor(s / 60)}m ago`
  if (s < 86400)   return `${Math.floor(s / 3600)}h ago`
  if (s < 604800)  return `${Math.floor(s / 86400)}d ago`
  if (s < 2592000) return `${Math.floor(s / 604800)}w ago`
  return `${Math.floor(s / 2592000)}mo ago`
}

function filterByTab(notifs: Notif[], tab: NotifTab): Notif[] {
  switch (tab) {
    case 'inbox':
      return notifs.filter(n => !n.is_archived && (n.type === 'mention' || n.type === 'reply'))
    case 'mentions':
      return notifs.filter(n => !n.is_archived && n.type === 'mention')
    case 'following':
      return notifs.filter(n => !n.is_archived && (n.type === 'new_post' || n.type === 'new_agent_post'))
    case 'all':
      return notifs.filter(n => !n.is_archived)
    case 'archived':
      return notifs.filter(n => n.is_archived)
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'mention':        return '@Mention'
    case 'reply':          return 'Reply'
    case 'new_post':       return 'New Post'
    case 'new_agent_post': return 'Agent Post'
    default:               return 'Activity'
  }
}

function typeDot(type: string): string {
  switch (type) {
    case 'mention':        return '#C2185B'
    case 'reply':          return '#D4AF37'
    case 'new_post':       return '#0A2342'
    case 'new_agent_post': return '#2D5A8E'
    default:               return '#8AA4C8'
  }
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 28, height: 28,
        border: '2px solid rgba(212,175,55,0.2)',
        borderTopColor: '#D4AF37', borderRadius: '50%',
        animation: 'dru-spin 0.8s linear infinite',
      }} />
    </div>
  )
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  notif, sender, isArchived, onRead, onArchive, onUnarchive,
}: {
  notif: Notif
  sender: SenderProfile | null
  isArchived: boolean
  onRead: (id: string) => void
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)

  const fullName = sender
    ? [sender.first_name, sender.last_name].filter(Boolean).join(' ')
    : null
  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : '✦'

  const handleClick = () => {
    if (!notif.is_read) onRead(notif.id)
    if (notif.post_id) { navigate('/feed') }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 20px',
        background: hovered ? '#F5F4F0' : notif.is_read ? 'transparent' : 'rgba(212,175,55,0.03)',
        borderBottom: '1px solid rgba(10,35,66,0.05)',
        position: 'relative', cursor: 'pointer',
      }}
    >
      {/* Unread stripe */}
      {!notif.is_read && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 3, background: '#D4AF37', borderRadius: '0 2px 2px 0',
        }} />
      )}

      {/* Sender avatar */}
      <div
        onClick={handleClick}
        style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #1e3d6e, #0A2342)',
          border: '1.5px solid rgba(212,175,55,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {sender?.photo_url
          ? <img src={sender.photo_url} alt={fullName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#D4AF37' }}>{initials}</span>
        }
      </div>

      {/* Content */}
      <div onClick={handleClick} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{
            display: 'inline-block', padding: '1px 7px', borderRadius: 10,
            fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: `${typeDot(notif.type)}15`,
            color: typeDot(notif.type),
          }}>
            {typeLabel(notif.type)}
          </span>
        </div>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 13,
          color: '#0A2342', lineHeight: 1.5, margin: '0 0 4px',
          fontWeight: notif.is_read ? 400 : 500,
        }}>
          {notif.message}
        </p>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 11,
          color: '#8AA4C8', margin: 0, fontWeight: 500,
        }}>
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {!notif.is_read && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C2185B' }} />
        )}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); isArchived ? onUnarchive(notif.id) : onArchive(notif.id) }}
            title={isArchived ? 'Unarchive' : 'Archive'}
            style={{
              padding: '4px 8px', borderRadius: 6,
              background: 'rgba(10,35,66,0.06)', border: 'none',
              fontFamily: 'Montserrat, sans-serif', fontSize: 10,
              fontWeight: 700, color: 'rgba(10,35,66,0.4)',
              letterSpacing: '0.04em', cursor: 'pointer',
            }}
          >
            {isArchived ? 'Restore' : 'Archive'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

const TABS: { id: NotifTab; label: string }[] = [
  { id: 'inbox',    label: 'Inbox'     },
  { id: 'mentions', label: 'Mentions'  },
  { id: 'following',label: 'Following' },
  { id: 'all',      label: 'All'       },
  { id: 'archived', label: 'Archived'  },
]

export default function Notifications() {
  const { profile } = useAuth()
  const [tab,     setTab]     = useState<NotifTab>('inbox')
  const [notifs,  setNotifs]  = useState<Notif[]>([])
  const [senders, setSenders] = useState<Record<string, SenderProfile>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    fetchAll()
  }, [profile?.id])

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase
      .from('community_notifications')
      .select('id, sender_id, post_id, type, message, is_read, is_archived, created_at')
      .eq('recipient_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(100)

    const list = (data ?? []) as Notif[]
    setNotifs(list)

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
    setLoading(false)
  }

  const markAllRead = async () => {
    const visible = filterByTab(notifs, tab)
    const ids = visible.filter(n => !n.is_read).map(n => n.id)
    if (ids.length === 0) return
    await supabase.from('community_notifications').update({ is_read: true }).in('id', ids)
    setNotifs(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n))
  }

  const markOneRead = (id: string) => {
    supabase.from('community_notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const archiveNotif = (id: string) => {
    supabase.from('community_notifications').update({ is_archived: true, is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_archived: true, is_read: true } : n))
  }

  const unarchiveNotif = (id: string) => {
    supabase.from('community_notifications').update({ is_archived: false }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_archived: false } : n))
  }

  // Tab unread counts
  const unreadCount = (t: NotifTab) =>
    filterByTab(notifs, t).filter(n => !n.is_read).length

  const displayed = filterByTab(notifs, tab)
  const hasUnread = displayed.some(n => !n.is_read)

  if (loading) return <Loader />

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700,
    color: 'rgba(10,35,66,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase',
  }

  return (
    <div style={{ padding: '28px 24px', maxWidth: 760, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700,
            color: '#0A2342', margin: '0 0 3px',
          }}>
            Notifications
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.45)', margin: 0 }}>
            Stay on top of your community activity
          </p>
        </div>
        {hasUnread && (
          <button
            onClick={markAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px',
              background: 'rgba(10,35,66,0.06)', border: 'none',
              borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontSize: 11,
              fontWeight: 700, color: '#0A2342',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}
          >
            ✓✓ Mark all read
          </button>
        )}
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', border: '1px solid rgba(10,35,66,0.08)',
        borderRadius: 16, overflow: 'hidden',
      }}>

        {/* Tab bar */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(10,35,66,0.08)',
          overflowX: 'auto', padding: '0 4px',
        }}>
          {TABS.map(t => {
            const count = unreadCount(t.id)
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '12px 16px', flexShrink: 0,
                  background: 'none', border: 'none',
                  borderBottom: `2px solid ${active ? '#0A2342' : 'transparent'}`,
                  marginBottom: -1,
                  fontFamily: 'Montserrat, sans-serif', fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#0A2342' : 'rgba(10,35,66,0.4)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                  transition: 'color 0.12s',
                }}
              >
                {t.label}
                {count > 0 && (
                  <span style={{
                    background: '#C2185B', color: '#fff',
                    borderRadius: 10, padding: '1px 6px',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: 9, fontWeight: 700,
                    lineHeight: '14px',
                  }}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* List */}
        {displayed.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 12 }}>🔔</div>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#0A2342', margin: '0 0 6px' }}>
              {tab === 'archived' ? 'No archived notifications' : "You're all caught up"}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(10,35,66,0.4)', margin: 0 }}>
              {tab === 'archived'
                ? 'Archived notifications will appear here'
                : tab === 'mentions'
                  ? 'Notifications where someone @mentions you will appear here'
                  : tab === 'following'
                    ? 'New posts from agents and members will appear here'
                    : 'New notifications will appear here'}
            </p>
          </div>
        ) : (
          <div>
            {displayed.map(notif => (
              <NotifRow
                key={notif.id}
                notif={notif}
                sender={notif.sender_id ? senders[notif.sender_id] ?? null : null}
                isArchived={tab === 'archived'}
                onRead={markOneRead}
                onArchive={archiveNotif}
                onUnarchive={unarchiveNotif}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
