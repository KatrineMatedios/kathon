import { Search, UserCheck, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client'
import { Button, EmptyState, Input, LoadingState, PageHeader, Pagination, Select } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { Paginated, User } from '../../types'
import { formatDate, initials } from '../../utils'

export function AdminUsers() {
  const { user: currentUser } = useAuth()
  const { success, error } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<Paginated<User>['meta'] | undefined>()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [updating, setUpdating] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.get<Paginated<User>>('/admin/users', { params: { q: search, role, status, page, per_page: 15 } })
      .then(({ data }) => { setUsers(data.data); setMeta(data.meta) })
      .catch((err) => error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, role, status, error])

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); load() }, 350)
    return () => window.clearTimeout(timer)
  }, [search])

  const toggleStatus = async (user: User) => {
    setUpdating(user.id)
    try {
      const { data } = await api.put<{ message: string }>(`/admin/users/${user.id}/status`, { is_active: !user.is_active })
      success(data.message)
      load()
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      <PageHeader title="Manage users" subtitle="View student accounts and control access." />

      <div className="app-card mb-5 grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b09b8b]" size={17} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or ID" className="pl-11" />
        </div>
        <Select value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="admin">Administrators</option>
        </Select>
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading users…" />
      ) : users.length ? (
        <>
          <div className="app-card overflow-hidden">
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-[#f0e3d0] bg-cream px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted lg:grid">
              <span>User</span><span>Student ID</span><span>Joined</span><span className="text-right">Status / Action</span>
            </div>
            {users.map((user) => (
              <div key={user.id} className="grid gap-3 border-b border-[#f2e8db] p-4 last:border-0 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brown-light text-xs font-extrabold text-brown">
                    {user.profile_photo_url ? <img src={user.profile_photo_url} alt="" className="h-full w-full object-cover" /> : initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                </div>
                <p className="text-sm text-muted lg:text-ink">{user.student_id ?? '—'}</p>
                <p className="text-xs text-muted">{formatDate(user.created_at)}</p>
                <div className="flex items-center justify-between gap-2 lg:justify-end">
                  <span className={`chip ${user.is_active ? 'bg-sage/20 text-[#2f6d42]' : 'bg-blush/20 text-[#a4483f]'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <Button
                    size="sm"
                    variant={user.is_active ? 'danger' : 'secondary'}
                    onClick={() => toggleStatus(user)}
                    loading={updating === user.id}
                    disabled={user.id === currentUser?.id}
                    aria-label={user.is_active ? 'Deactivate user' : 'Activate user'}
                  >
                    {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                    <span className="hidden sm:inline">{user.is_active ? 'Deactivate' : 'Activate'}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No users found" description="Try a different search term or filter." />
      )}
    </div>
  )
}
