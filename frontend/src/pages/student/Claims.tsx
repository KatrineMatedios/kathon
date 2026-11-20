import { CalendarDays, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, ItemImage, LoadingState, PageHeader } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { Claim, Paginated } from '../../types'
import { cn, formatDate } from '../../utils'

export function Claims() {
  const { error } = useToast()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get<Paginated<Claim>>('/claims', { params: { per_page: 100 } })
      .then(({ data }) => { if (active) setClaims(data.data) })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [error])

  const visible = claims.filter((claim) => filter === 'all' || claim.status === filter)

  return (
    <div>
      <PageHeader title="My claims" subtitle="Track ownership claims you submitted or received." />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn('chip shrink-0 capitalize', filter === key ? 'bg-brown text-white' : 'bg-white text-brown shadow-sm')}
          >
            {key}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading claims…" />
      ) : visible.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((claim) => (
            <div key={claim.id} className="app-card p-4">
              <div className="flex gap-3">
                <ItemImage
                  src={claim.item?.image_url}
                  type={claim.item?.item_type}
                  alt={claim.item?.item_name ?? 'Item'}
                  className="h-20 w-20 shrink-0 rounded-2xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Claim #{claim.id}</p>
                      <h3 className="truncate text-base font-extrabold text-ink">{claim.item?.item_name ?? 'Item'}</h3>
                    </div>
                    <span className={cn(
                      'chip',
                      claim.status === 'approved' ? 'bg-sage/20 text-[#2f6d42]' :
                        claim.status === 'rejected' ? 'bg-blush/20 text-[#a4483f]' : 'bg-[#f2dfbd] text-[#8a5a1f]',
                    )}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                    <CalendarDays size={12} /> {formatDate(claim.created_at)}
                  </p>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 rounded-xl bg-cream p-3 text-xs leading-relaxed text-muted">{claim.reason}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {claim.item && <Link to={`/items/${claim.item_id}`} className="btn-outline flex-1 !py-2 !text-xs">View item</Link>}
                {claim.status === 'approved' && (
                  <Link to={`/verification/${claim.verification_code}`} className="btn-secondary flex-1 !py-2 !text-xs">
                    <QrCode size={14} /> Verification
                  </Link>
                )}
                {claim.proof_url && (
                  <a href={claim.proof_url} target="_blank" rel="noreferrer" className="btn-outline !py-2 !text-xs">Proof</a>
                )}
              </div>

              <div className="mt-4 border-t border-[#f2e8db] pt-3">
                <div className="flex items-center gap-2">
                  {['Submitted', 'Under review', claim.status === 'rejected' ? 'Not approved' : 'Approved'].map((step, index) => (
                    <div key={step} className="flex flex-1 items-center gap-1.5">
                      <span className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        index === 0 || (index === 1 && claim.status !== 'pending') || (index === 2 && claim.status !== 'pending') ? 'bg-sage' : 'bg-[#e2d3c1]',
                      )} />
                      <span className="text-[9px] font-bold text-muted">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No claims yet" description="When you claim an item, its status and verification code will appear here." />
      )}
    </div>
  )
}
