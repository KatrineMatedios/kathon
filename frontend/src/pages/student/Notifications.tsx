import { Bell, BellRing, CheckCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client'
import { Button, EmptyState, LoadingState, PageHeader, Pagination } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { AppNotification, Paginated } from '../../types'
import { cn, formatDateTime } from '../../utils'

export function Notifications() {
  const { success, error } = useToast()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [meta, setMeta] = useState<Paginated<AppNotification>['meta'] | undefined>()
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = () => {
    setLoading(true)
    api.get<Paginated<AppNotification>>('/notifications', { params: { page, per_page: 20 } })
      .then(({ data }) => {
        setNotifications(data.data)
        setMeta(data.meta)
        setUnread(data.unread_count ?? 0)
      })
      .catch((err) => error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, error])

  const markRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item))
      setUnread((count) => Math.max(0, count - 1))
    } catch (err) {
      error(getErrorMessage(err))
    }
  }

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
      setUnread(0)
      success('All notifications marked as read.')
    } catch (err) {
      error(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `You have ${unread} unread notification${unread === 1 ? '' : 's'}.` : 'You are all caught up.'}
        action={unread > 0 ? <Button variant="outline" size="sm" onClick={markAll}><CheckCheck size={15} /> Mark all read</Button> : undefined}
      />

      {loading ? (
        <LoadingState label="Loading notifications…" />
      ) : notifications.length ? (
        <>
          <div className="app-card overflow-hidden">
            {notifications.map((notification, index) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => !notification.is_read && markRead(notification.id)}
                className={cn(
                  'flex w-full gap-3 p-4 text-left transition hover:bg-cream',
                  index > 0 && 'border-t border-[#f2e8db]',
                  !notification.is_read && 'bg-[#fffdf7]',
                )}
              >
                <span className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                  notification.is_read ? 'bg-cream text-muted' : 'bg-brown-light text-brown',
                )}>
                  {notification.is_read ? <Bell size={18} /> : <BellRing size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink">{notification.title}</span>
                    {!notification.is_read && <span className="h-2 w-2 rounded-full bg-blush" />}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{notification.message}</span>
                  <span className="mt-1.5 block text-[11px] text-muted">{formatDateTime(notification.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No notifications" description="Updates about your reports and claims will show up here." />
      )}
    </div>
  )
}
