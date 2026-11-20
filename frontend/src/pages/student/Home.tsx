import { ArrowRight, BookMarked, Compass, FileSearch, PackageSearch, PlusCircle, SearchCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { ItemCard } from '../../components/ItemCard'
import { EmptyState, LoadingState, SectionTitle } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { Item, Paginated } from '../../types'
import { getErrorMessage } from '../../api/client'

function DashboardIllustration() {
  return (
    <svg viewBox="0 0 320 210" className="h-full w-full" role="img" aria-label="Lost and found illustration">
      <ellipse cx="160" cy="187" rx="112" ry="12" fill="#E9D2B2" opacity="0.7" />
      <path d="M72 62c0-9 7-16 16-16h46c9 0 16 7 16 16v104c0-8-7-14-16-14H88c-9 0-16 6-16 14z" fill="#F5E5CD" />
      <path d="M88 46h46v106H88z" fill="#FFFDF8" />
      <path d="M96 67h30M96 80h30M96 93h20" stroke="#E9D2B2" strokeWidth="5" strokeLinecap="round" />
      <path d="M176 62c0-9 7-16 16-16h46c9 0 16 7 16 16v104c0-8-7-14-16-14h-46c-9 0-16 6-16 14z" fill="#E9D2B2" />
      <path d="M192 46h46v106h-46z" fill="#FFFDF8" />
      <path d="M202 67h26M202 80h26M202 93h16" stroke="#E9D2B2" strokeWidth="5" strokeLinecap="round" />
      <circle cx="206" cy="128" r="35" fill="#79B68A" opacity="0.22" />
      <circle cx="200" cy="121" r="26" fill="none" stroke="#60351F" strokeWidth="8" />
      <path d="M219 141l22 22" stroke="#60351F" strokeWidth="11" strokeLinecap="round" />
      <path d="M188 121l8 8 15-17" stroke="#79B68A" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M112 139l15-20 14 14 11-11 19 22z" fill="#E99B91" opacity="0.8" />
      <circle cx="125" cy="118" r="6" fill="#60351F" opacity="0.55" />
    </svg>
  )
}

export function Home() {
  const { user } = useAuth()
  const { error } = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [lostTotal, setLostTotal] = useState(0)
  const [foundTotal, setFoundTotal] = useState(0)
  const [myTotal, setMyTotal] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      api.get<Paginated<Item>>('/items', { params: { per_page: 8 } }),
      api.get<Paginated<Item>>('/items', { params: { item_type: 'lost', per_page: 1 } }),
      api.get<Paginated<Item>>('/items', { params: { item_type: 'found', per_page: 1 } }),
      api.get<Paginated<Item>>('/my-reports', { params: { per_page: 1 } }),
    ])
      .then(([recent, lost, found, mine]) => {
        if (!active) return
        setItems(recent.data.data)
        setLostTotal(lost.data.meta.total)
        setFoundTotal(found.data.meta.total)
        setMyTotal(mine.data.meta.total)
      })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [error])

  const firstName = user?.name?.split(' ')[0] ?? 'Student'
  const recent = items.slice(0, 3)
  const latestFound = items.filter((item) => item.item_type === 'found').slice(0, 3)
  const quickActions = [
    { to: '/report/lost', label: 'Report Lost Item', icon: PlusCircle, color: 'bg-blush/20 text-[#a4483f]' },
    { to: '/report/found', label: 'Report Found Item', icon: SearchCheck, color: 'bg-sage/20 text-[#2f6d42]' },
    { to: '/browse', label: 'Browse Items', icon: Compass, color: 'bg-brown-light text-brown' },
  ]

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-brown px-5 pb-5 pt-6 text-white sm:px-7">
        <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#e4d1c0]">
            <Sparkles size={14} /> CampusFind dashboard
          </p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">Hello, {firstName} 👋</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#e8d8c8]">
            Did you lose something today? Let's help you find it or return it to its owner.
          </p>
        </div>
        <div className="relative mx-auto mt-3 h-40 max-w-sm animate-float-soft sm:h-44">
          <DashboardIllustration />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          { label: 'Lost Items', value: lostTotal, icon: PackageSearch, tint: 'bg-blush/20 text-[#a4483f]' },
          { label: 'Found Items', value: foundTotal, icon: SearchCheck, tint: 'bg-sage/20 text-[#2f6d42]' },
          { label: 'My Reports', value: myTotal, icon: FileSearch, tint: 'bg-brown-light text-brown' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="app-card p-3 text-center sm:p-4">
              <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl ${stat.tint}`}>
                <Icon size={19} />
              </span>
              <p className="mt-2 text-xl font-extrabold text-brown">{loading ? '–' : stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{stat.label}</p>
            </div>
          )
        })}
      </section>

      <section>
        <SectionTitle title="Quick actions" />
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.to}
                to={action.to}
                className="app-card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${action.color}`}>
                  <Icon size={21} />
                </span>
                <span className="text-sm font-bold text-ink">{action.label}</span>
                <ArrowRight size={16} className="ml-auto text-muted" />
              </Link>
            )
          })}
        </div>
      </section>

      {loading ? (
        <LoadingState label="Loading latest items…" />
      ) : (
        <>
          <section>
            <SectionTitle
              title="Recently reported"
              action={<Link to="/browse" className="text-xs font-bold text-brown">See all</Link>}
            />
            {recent.length ? (
              <div className="grid gap-3 lg:grid-cols-3">
                {recent.map((item) => <ItemCard key={item.id} item={item} compact />)}
              </div>
            ) : (
              <EmptyState title="No reports yet" description="Be the first to report an item on campus." />
            )}
          </section>

          <section>
            <SectionTitle
              title="Latest found items"
              action={<Link to="/browse?type=found" className="text-xs font-bold text-brown">View found</Link>}
            />
            {latestFound.length ? (
              <div className="grid gap-3 lg:grid-cols-3">
                {latestFound.map((item) => <ItemCard key={item.id} item={item} compact />)}
              </div>
            ) : (
              <EmptyState title="No found items yet" description="Found something? Help return it by submitting a report." />
            )}
          </section>

          <section className="soft-card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brown shadow-sm">
              <BookMarked size={23} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-ink">Lost and found, made simple</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Every report is reviewed by an administrator before it appears in search results.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
