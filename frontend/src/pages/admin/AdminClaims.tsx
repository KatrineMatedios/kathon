import { Check, Eye, FileImage, QrCode, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client'
import { Button, EmptyState, ItemImage, LoadingState, PageHeader, Pagination, Select } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { Claim, Paginated } from '../../types'
import { formatDate } from '../../utils'

export function AdminClaims() {
  const { success, error } = useToast()
  const [claims, setClaims] = useState<Claim[]>([])
  const [meta, setMeta] = useState<Paginated<Claim>['meta'] | undefined>()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.get<Paginated<Claim>>('/admin/claims', { params: { status, page, per_page: 15 } })
      .then(({ data }) => { setClaims(data.data); setMeta(data.meta) })
      .catch((err) => error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [status, page, error])

  const review = async (id: number, next: 'approved' | 'rejected') => {
    setBusy(id)
    try {
      const { data } = await api.put(`/admin/claims/${id}/status`, { status: next })
      success(data.message)
      load()
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageHeader title="Manage claims" subtitle="Review proof of ownership and approve returns." />

      <div className="app-card mb-5 p-4">
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="">All claims</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading claims…" />
      ) : claims.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {claims.map((claim) => (
              <div key={claim.id} className="app-card p-4">
                <div className="flex gap-3">
                  <ItemImage src={claim.item?.image_url} type={claim.item?.item_type} alt={claim.item?.item_name ?? 'Item'} className="h-24 w-24 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip bg-cream text-brown">Claim #{claim.id}</span>
                      <span className={`chip capitalize ${claim.status === 'approved' ? 'bg-sage/20 text-[#2f6d42]' : claim.status === 'rejected' ? 'bg-blush/20 text-[#a4483f]' : 'bg-[#f2dfbd] text-[#8a5a1f]'}`}>
                        {claim.status}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-sm font-extrabold text-ink">{claim.item?.item_name ?? 'Item'}</h3>
                    <p className="text-xs text-muted">Claimed by {claim.claimant?.name ?? 'Student'} · {formatDate(claim.created_at)}</p>
                  </div>
                </div>

                <p className="mt-3 rounded-xl bg-cream p-3 text-xs leading-relaxed text-muted">{claim.reason}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {claim.item && <Link to={`/items/${claim.item_id}`} className="btn-outline flex-1 !py-2 !text-xs"><Eye size={14} /> View item</Link>}
                  {claim.proof_url && <a href={claim.proof_url} target="_blank" rel="noreferrer" className="btn-outline !py-2 !text-xs"><FileImage size={14} /> Proof</a>}
                  {claim.status === 'approved' && (
                    <Link to={`/verification/${claim.verification_code}`} className="btn-secondary !py-2 !text-xs"><QrCode size={14} /> Verification</Link>
                  )}
                </div>

                {claim.status === 'pending' && (
                  <div className="mt-4 flex gap-2 border-t border-[#f2e8db] pt-3">
                    <Button fullWidth size="sm" variant="secondary" loading={busy === claim.id} onClick={() => review(claim.id, 'approved')}>
                      <Check size={15} /> Approve
                    </Button>
                    <Button fullWidth size="sm" variant="danger" loading={busy === claim.id} onClick={() => review(claim.id, 'rejected')}>
                      <X size={15} /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No claims found" description="Claims submitted by students will appear here." />
      )}
    </div>
  )
}
