import { CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Item } from '../types'
import { cn, formatDate } from '../utils'
import { ItemImage, StatusBadge, TypeBadge } from './ui'

export function ItemCard({ item, compact = false }: { item: Item; compact?: boolean }) {
  if (compact) {
    return (
      <Link
        to={`/items/${item.id}`}
        className="flex gap-3 rounded-2xl border border-[#f0e3d0] bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <ItemImage
          src={item.image_url}
          type={item.item_type}
          alt={item.item_name}
          className="h-20 w-20 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-bold text-ink">{item.item_name}</p>
            <TypeBadge type={item.item_type} />
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted">{item.description}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1"><MapPin size={12} /> {item.location}</span>
            <span className="flex items-center gap-1"><CalendarDays size={12} /> {formatDate(item.lost_found_date)}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#efe4d4] bg-white shadow-[0_10px_30px_-22px_rgba(96,53,31,0.7)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgba(96,53,31,0.75)]"
    >
      <div className="relative h-44 overflow-hidden bg-[#f7ecdd]">
        <ItemImage
          src={item.image_url}
          type={item.item_type}
          alt={item.item_name}
          className="h-full w-full transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <TypeBadge type={item.item_type} />
          <StatusBadge status={item.item_status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-extrabold text-ink">{item.item_name}</h3>
          <span className="chip shrink-0 bg-cream text-[10px] text-brown">{item.category?.name ?? 'Uncategorized'}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{item.description}</p>
        <div className="mt-3 space-y-1.5 text-xs text-muted">
          <p className="flex items-center gap-1.5"><MapPin size={14} className="text-brown/70" /> {item.location}</p>
          <p className="flex items-center gap-1.5"><CalendarDays size={14} className="text-brown/70" /> {formatDate(item.lost_found_date)}</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#f2e8db] pt-3">
          <span className="text-xs font-semibold text-brown">View details</span>
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-full bg-brown-light text-brown transition group-hover:bg-brown group-hover:text-white')}>
            →
          </span>
        </div>
      </div>
    </Link>
  )
}
