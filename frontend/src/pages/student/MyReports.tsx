import { CalendarDays, Edit3, Eye, MapPin, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api, { getErrorMessage, getValidationErrors } from '../../api/client'
import {
  Button,
  EmptyState,
  Field,
  Input,
  ItemImage,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  TypeBadge,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { Category, Item, Paginated } from '../../types'
import { cn, formatDate } from '../../utils'

type Filter = 'all' | 'lost' | 'found' | 'pending' | 'approved' | 'resolved'

const filters: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'lost', label: 'Lost' },
  { key: 'found', label: 'Found' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'resolved', label: 'Resolved' },
]

export function MyReports() {
  const { success, error } = useToast()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [deleting, setDeleting] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [validation, setValidation] = useState<Record<string, string[]>>({})
  const [editForm, setEditForm] = useState({
    item_name: '',
    category_id: '',
    description: '',
    location: '',
    lost_found_date: '',
    additional_information: '',
  })

  const editId = Number(params.get('edit') ?? 0)
  const editingItem = items.find((item) => item.id === editId)

  const load = () => {
    setLoading(true)
    api.get<Paginated<Item>>('/my-reports', { params: { per_page: 100 } })
      .then(({ data }) => setItems(data.data))
      .catch((err) => error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [error])

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories')
      .then(({ data }) => setCategories(data.categories))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!editingItem) return
    setEditForm({
      item_name: editingItem.item_name,
      category_id: editingItem.category?.id ? String(editingItem.category.id) : '',
      description: editingItem.description,
      location: editingItem.location,
      lost_found_date: editingItem.lost_found_date ?? '',
      additional_information: editingItem.additional_information ?? '',
    })
  }, [editingItem])

  const filtered = useMemo(() => items.filter((item) => {
    switch (filter) {
      case 'lost': return item.item_type === 'lost'
      case 'found': return item.item_type === 'found'
      case 'pending': return item.item_status === 'pending'
      case 'approved': return item.item_status === 'approved'
      case 'resolved': return ['resolved', 'returned'].includes(item.item_status)
      default: return true
    }
  }), [items, filter])

  const closeEdit = () => {
    const next = new URLSearchParams(params)
    next.delete('edit')
    setParams(next)
    setValidation({})
  }

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editId) return
    setSaving(true)
    setValidation({})
    try {
      await api.put(`/items/${editId}`, editForm)
      success('Report updated successfully.')
      closeEdit()
      load()
    } catch (err) {
      setValidation(getValidationErrors(err))
      error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!window.confirm('Delete this report permanently?')) return
    setDeleting(id)
    try {
      await api.delete(`/items/${id}`)
      success('Report deleted.')
      load()
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <PageHeader title="My reports" subtitle="Manage and track everything you have reported." />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            className={cn(
              'chip shrink-0',
              filter === option.key ? 'bg-brown text-white' : 'bg-white text-brown shadow-sm',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading your reports…" />
      ) : filtered.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => (
            <div key={item.id} className="app-card overflow-hidden">
              <div className="flex gap-4 p-4">
                <ItemImage src={item.image_url} type={item.item_type} alt={item.item_name} className="h-28 w-28 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={item.item_type} />
                    <StatusBadge status={item.item_status} />
                  </div>
                  <h3 className="mt-2 truncate text-base font-extrabold text-ink">{item.item_name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>
                  <div className="mt-2 space-y-1 text-[11px] text-muted">
                    <p className="flex items-center gap-1.5"><CalendarDays size={12} /> {formatDate(item.date_reported)}</p>
                    <p className="flex items-center gap-1.5"><MapPin size={12} /> {item.location}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#f2e8db] bg-[#fffdf9] px-4 py-3">
                <div className="mb-3 flex items-center gap-1.5">
                  {['Submitted', 'Admin review', 'Published'].map((step, index) => {
                    const done = index === 0 || (index === 1 && item.item_status !== 'pending') || (index === 2 && ['approved', 'returned', 'resolved'].includes(item.item_status))
                    return (
                      <div key={step} className="flex flex-1 items-center gap-1.5">
                        <span className={cn('h-2.5 w-2.5 rounded-full', done ? 'bg-sage' : 'bg-[#e2d3c1]')} />
                        <span className="text-[9px] font-bold text-muted">{step}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Link to={`/items/${item.id}`} className="btn-outline flex-1 !py-2 !text-xs"><Eye size={14} /> Details</Link>
                  <button type="button" onClick={() => setParams({ edit: String(item.id) })} className="btn-secondary !py-2 !text-xs">
                    <Edit3 size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => remove(item.id)} disabled={deleting === item.id} className="btn-danger !px-3 !py-2" aria-label="Delete report">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No reports here yet"
          description="Submit a lost or found item report to see it here."
          action={<Link to="/report/lost" className="btn-primary">Report an item</Link>}
        />
      )}

      <Modal open={Boolean(editingItem)} title="Edit report" onClose={closeEdit}>
        <form onSubmit={submitEdit} className="space-y-4">
          <Field label="Item name" hint={validation.item_name?.[0]}>
            <Input value={editForm.item_name} onChange={(event) => setEditForm({ ...editForm, item_name: event.target.value })} required />
          </Field>
          <Field label="Category" hint={validation.category_id?.[0]}>
            <Select value={editForm.category_id} onChange={(event) => setEditForm({ ...editForm, category_id: event.target.value })}>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </Field>
          <Field label="Description" hint={validation.description?.[0]}>
            <Textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" hint={validation.location?.[0]}>
              <Input value={editForm.location} onChange={(event) => setEditForm({ ...editForm, location: event.target.value })} required />
            </Field>
            <Field label="Date" hint={validation.lost_found_date?.[0]}>
              <Input type="date" value={editForm.lost_found_date} onChange={(event) => setEditForm({ ...editForm, lost_found_date: event.target.value })} required />
            </Field>
          </div>
          <Field label="Additional information">
            <Textarea value={editForm.additional_information} onChange={(event) => setEditForm({ ...editForm, additional_information: event.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth onClick={closeEdit}>Cancel</Button>
            <Button type="submit" fullWidth loading={saving}>Save changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
