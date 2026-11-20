import {
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  FolderClock,
  IdCard,
  LogOut,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { initials } from '../../utils'

interface MenuItem {
  to: string
  label: string
  description: string
  icon: ComponentType<{ size?: number; className?: string }>
}

export function Profile() {
  const { user, isAdmin, logout } = useAuth()
  const { error } = useToast()
  const navigate = useNavigate()

  const menu: MenuItem[] = [
    { to: '/personal-info', label: 'Personal Information', description: 'Name, student ID, email and contact details', icon: IdCard },
    { to: '/my-reports', label: 'My Reports', description: 'Reports you have submitted', icon: FolderClock },
    { to: '/activity', label: 'Activity History', description: 'Everything you have done on CampusFind', icon: BookOpen },
    { to: '/notifications', label: 'Notifications', description: 'Updates and alerts', icon: Bell },
    { to: '/help', label: 'Help and Support', description: 'FAQs and contact support', icon: CircleHelp },
  ]

  if (isAdmin) {
    menu.unshift({ to: '/admin', label: 'Administrator Panel', description: 'Manage users, reports, claims and categories', icon: ShieldCheck })
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      error('Could not sign out. Please try again.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="app-card overflow-hidden">
        <div className="h-24 bg-brown" />
        <div className="-mt-12 px-5 pb-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brown-light text-2xl font-extrabold text-brown shadow-md">
            {user?.profile_photo_url
              ? <img src={user.profile_photo_url} alt="" className="h-full w-full object-cover" />
              : initials(user?.name)}
          </div>
          <h1 className="mt-3 text-xl font-extrabold text-brown">{user?.name}</h1>
          <p className="mt-1 text-sm text-muted">{user?.student_id ?? 'Administrator'}</p>
          <span className="mt-3 inline-flex rounded-full bg-sage/20 px-3 py-1 text-xs font-bold capitalize text-[#2f6d42]">
            {user?.role}
          </span>

          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="soft-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Email</p>
              <p className="mt-1 truncate text-xs font-bold text-ink">{user?.email}</p>
            </div>
            <div className="soft-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Phone</p>
              <p className="mt-1 truncate text-xs font-bold text-ink">{user?.phone ?? 'Not set'}</p>
            </div>
          </div>
          <Link to="/personal-info" className="btn-secondary mt-5 w-full">
            <UserRound size={16} /> Edit profile
          </Link>
        </div>
      </div>

      <div className="app-card overflow-hidden">
        {menu.map((item, index) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-4 transition hover:bg-cream ${index > 0 ? 'border-t border-[#f2e8db]' : ''}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brown-light/50 text-brown">
                <Icon size={19} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink">{item.label}</span>
                <span className="block text-xs text-muted">{item.description}</span>
              </span>
              <ChevronRight size={17} className="text-muted" />
            </Link>
          )
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 border-t border-[#f2e8db] px-4 py-4 text-left transition hover:bg-blush/10"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blush/20 text-[#a4483f]">
            <LogOut size={19} />
          </span>
          <span className="flex-1 text-sm font-bold text-[#a4483f]">Logout</span>
          <ChevronRight size={17} className="text-[#a4483f]" />
        </button>
      </div>
    </div>
  )
}
