import {
  Bell,
  BookOpen,
  ClipboardList,
  Compass,
  FolderClock,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings2,
  ShieldCheck,
  Tags,
  Ticket,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { Paginated, AppNotification } from '../types'
import { cn, initials } from '../utils'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  end?: boolean
}

const studentNav: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home, end: true },
  { to: '/browse', label: 'Browse', icon: Compass },
  { to: '/my-reports', label: 'My Reports', icon: FolderClock },
  { to: '/claims', label: 'Claims', icon: ClipboardList },
  { to: '/activity', label: 'Activity', icon: BookOpen },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/help', label: 'Help & Support', icon: HelpCircle },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: ClipboardList },
  { to: '/admin/claims', label: 'Claims', icon: ShieldCheck },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/logs', label: 'Activity Logs', icon: BookOpen },
  { to: '/admin/support', label: 'Support Tickets', icon: Ticket },
]

function SideLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition',
        isActive ? 'bg-white/15 text-white' : 'text-[#e8d8c8] hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon size={18} />
      {item.label}
    </NavLink>
  )
}

export function AppShell() {
  const { user, isAdmin, logout } = useAuth()
  const { error } = useToast()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    api.get<Paginated<AppNotification>>('/notifications', { params: { per_page: 1 } })
      .then(({ data }) => { if (active) setUnread(data.unread_count ?? 0) })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      error('Could not sign out. Please try again.')
    }
  }

  const bottomItems: NavItem[] = isAdmin ? [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/reports', label: 'Reports', icon: ClipboardList },
    { to: '/admin/claims', label: 'Claims', icon: ShieldCheck },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/profile', label: 'Profile', icon: UserRound },
  ] : [
    { to: '/home', label: 'Home', icon: Home, end: true },
    { to: '/browse', label: 'Browse', icon: Compass },
    { to: '/report/lost', label: 'Report', icon: Plus },
    { to: '/my-reports', label: 'Reports', icon: FolderClock },
    { to: '/profile', label: 'Profile', icon: UserRound },
  ]

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brown px-4 py-6 text-white lg:flex">
        <Link to="/home" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brown-light text-xl font-extrabold text-brown">CF</span>
          <span>
            <span className="block text-lg font-extrabold leading-tight">CampusFind</span>
            <span className="text-[11px] text-[#d8c3b1]">Lost & Found Hub</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
          {(isAdmin ? adminNav : studentNav).map((item) => <SideLink key={item.to} item={item} />)}
          {isAdmin && (
            <div className="!mt-5 border-t border-white/15 pt-4">
              <p className="px-3.5 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#c8b09c]">Student app</p>
              <SideLink item={{ to: '/home', label: 'Student Home', icon: Home }} />
              <SideLink item={{ to: '/browse', label: 'Browse Items', icon: Compass }} />
            </div>
          )}
        </nav>

        <div className="mt-4 rounded-2xl bg-white/10 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brown-light text-sm font-extrabold text-brown">
              {user?.profile_photo_url
                ? <img src={user.profile_photo_url} alt="" className="h-full w-full object-cover" />
                : initials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{user?.name}</p>
              <p className="truncate text-[11px] text-[#d8c3b1]">{user?.student_id ?? user?.email}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-[#f0dfd0] hover:bg-white/10">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-brown text-white shadow-[0_10px_30px_-22px_rgba(0,0,0,0.8)] lg:bg-cream lg:text-brown lg:shadow-none">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4 lg:max-w-6xl lg:px-8">
            <Link to={isAdmin ? '/admin' : '/home'} className="flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brown-light text-sm font-extrabold text-brown">CF</span>
              <span className="text-base font-extrabold">CampusFind</span>
            </Link>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-muted">{isAdmin ? 'Administrator workspace' : 'Welcome back'}</p>
              <p className="text-lg font-extrabold text-brown">{user?.name?.split(' ')[0] ?? 'Student'}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isAdmin && (
                <NavLink
                  to="/notifications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 lg:bg-brown-light/60"
                  aria-label="Notifications"
                >
                  <Bell size={19} />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blush px-1 text-[9px] font-extrabold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </NavLink>
              )}
              <NavLink
                to={isAdmin ? '/admin' : '/profile'}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brown-light text-xs font-extrabold text-brown"
                aria-label="Profile"
              >
                {user?.profile_photo_url
                  ? <img src={user.profile_photo_url} alt="" className="h-full w-full object-cover" />
                  : initials(user?.name)}
              </NavLink>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-md px-4 pb-32 pt-6 lg:max-w-6xl lg:px-8 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eadcc8] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-end justify-between">
          {bottomItems.map((item, index) => {
            const Icon = item.icon
            if (index === 2) {
              return (
                <NavLink key={item.to} to={item.to} className="flex flex-col items-center gap-1">
                  <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-brown text-white shadow-[0_12px_24px_-12px_rgba(96,53,31,0.95)]">
                    <Icon size={24} />
                  </span>
                  <span className="text-[10px] font-bold text-brown">{item.label}</span>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(
                  'flex w-14 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition',
                  isActive ? 'text-brown' : 'text-muted',
                )}
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', isActive && 'bg-brown-light')}>
                      <Icon size={19} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export function AdminQuickLinks() {
  return (
    <div className="flex gap-2">
      <Link to="/admin/users" className="btn-outline !py-2 !text-xs"><UserCog size={14} /> Users</Link>
      <Link to="/profile" className="btn-outline !py-2 !text-xs"><Settings2 size={14} /> Settings</Link>
    </div>
  )
}
