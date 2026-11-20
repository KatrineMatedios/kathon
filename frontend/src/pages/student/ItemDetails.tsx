import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  ShieldCheck,
  Tag,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client'
import {
  Button,
  ItemImage,
  LoadingState,
  StatusBadge,
  TypeBadge,
} from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { Claim, Item } from '../../types'
import { formatDate, formatDateTime } from '../../utils'

type ItemDetail = Item & { my_claim?: Claim | null }

export function ItemDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { success, error } = useToast()
  const [item, setItem] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get<ItemDetail>(`/items/${id}`)
      .then(({ data }) => { if (active) setItem(data) })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, error])

  const markResolved = async () => {
    if (!item) return
    setActionLoading(true)
    try {
      await api.put(`/admin/reports/${item.id}/status`, { item_status: 'resolved' })
      setItem({ ...item, item_status: 'resolved' })
      success('Item marked as resolved.')
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const deleteReport = async () => {
    if (!item || !window.confirm('Delete this report permanently?')) return
    setActionLoading(true)
    try {
      await api.delete(`/items/${item.id}`)
      success('Report deleted.')
      navigate('/my-reports')
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState label="Loading item details…" />
  if (!item) {
    return (
      <div className="app-card p-8 text-center">
        <p className="font-bold text-ink">Item not found.</p>
        <Link to="/browse" className="btn-secondary mt-4">Back to browse</Link>
      </div>
    )
  }

  const canClaim = !item.is_owner && !['returned', 'resolved'].includes(item.item_status)
  const pendingClaim = item.my_claim?.status === 'pending'
  const approvedClaim = item.my_claim?.status === 'approved'
  const images = item.images?.length ? item.images : [item.image_url].filter(Boolean) as string[]

  return (
    <div className="space-y-5">
      <Link to="/browse" className="inline-flex items-center gap-2 text-sm font-bold text-brown">
        <ArrowLeft size={17} /> Back to browse
      </Link>

      <div className="app-card overflow-hidden">
        <div className="relative h-64 bg-[#f7ecdd] sm:h-80">
          <ItemImage src={item.image_url} type={item.item_type} alt={item.item_name} className="h-full w-full" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <TypeBadge type={item.item_type} />
            <StatusBadge status={item.item_status} />
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b border-[#f0e3d0] p-3 scrollbar-none">
            {images.map((src, index) => (
              <ItemImage
                key={`${src}-${index}`}
                src={src}
                type={item.item_type}
                alt={`${item.item_name} ${index + 1}`}
                className="h-16 w-16 shrink-0 rounded-xl"
              />
            ))}
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{item.category?.name ?? 'Uncategorized'}</p>
              <h1 className="mt-1 text-2xl font-extrabold text-brown">{item.item_name}</h1>
            </div>
            {item.is_owner && <span className="chip bg-brown-light text-brown">Your report</span>}
          </div>

          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-ink/80">{item.description}</p>

          {item.additional_information && (
            <div className="mt-4 rounded-2xl bg-cream p-4 text-sm text-muted">
              <span className="font-bold text-ink">Additional information: </span>
              {item.additional_information}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { icon: MapPin, label: item.item_type === 'lost' ? 'Lost at' : 'Found at', value: item.location },
              { icon: CalendarDays, label: item.item_type === 'lost' ? 'Date lost' : 'Date found', value: formatDate(item.lost_found_date) },
              { icon: Tag, label: 'Date reported', value: formatDateTime(item.date_reported) },
              { icon: UserRound, label: 'Reported by', value: item.reporter?.name ?? 'Unknown student' },
            ].map((detail) => {
              const Icon = detail.icon
              return (
                <div key={detail.label} className="soft-card flex items-start gap-3 p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brown">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{detail.label}</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-ink">{detail.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 border-t border-[#f0e3d0] pt-5">
            <p className="mb-3 text-sm font-extrabold text-ink">Actions</p>
            <div className="flex flex-wrap gap-2.5">
              {canClaim && !pendingClaim && !approvedClaim && (
                <Link to={`/items/${item.id}/claim`} className="btn-primary flex-1 sm:flex-none">
                  <ShieldCheck size={17} /> Claim item
                </Link>
              )}
              {pendingClaim && (
                <Link to="/claims" className="btn-secondary flex-1 sm:flex-none">Claim pending — track it</Link>
              )}
              {approvedClaim && item.my_claim?.verification_code && (
                <Link to={`/verification/${item.my_claim.verification_code}`} className="btn-secondary flex-1 sm:flex-none">
                  <CheckCircle2 size={17} /> View verification
                </Link>
              )}
              {item.reporter?.email && !item.is_owner && (
                <a href={`mailto:${item.reporter.email}?subject=${encodeURIComponent(`CampusFind: ${item.item_name}`)}`} className="btn-outline flex-1 sm:flex-none">
                  <Mail size={17} /> Contact reporter
                </a>
              )}
              {isAdmin && !['resolved', 'returned'].includes(item.item_status) && (
                <Button variant="secondary" onClick={markResolved} loading={actionLoading}>
                  <CheckCircle2 size={17} /> Mark as resolved
                </Button>
              )}
              {item.is_owner && (
                <Link to={`/my-reports?edit=${item.id}`} className="btn-outline">
                  <Edit3 size={16} /> Edit report
                </Link>
              )}
              {(item.is_owner || isAdmin) && (
                <Button variant="danger" onClick={deleteReport} loading={actionLoading}>
                  <Trash2 size={16} /> Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
