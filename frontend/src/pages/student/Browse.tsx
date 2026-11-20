import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client'
import { ItemCard } from '../../components/ItemCard'
import { EmptyState, Input, LoadingState, PageHeader, Pagination, Select } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { Category, Item, Paginated } from '../../types'
import { cn } from '../../utils'

export function Browse() {
  const { error } = useToast()
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [meta, setMeta] = useState<Paginated<Item>['meta'] | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(params.get('q') ?? '')

  const q = params.get('q') ?? ''
  const categoryId = params.get('category_id') ?? ''
  const itemType = params.get('item_type') ?? ''
  const status = params.get('status') ?? ''
  const sort = params.get('sort') ?? 'latest'
  const page = params.get('page') ?? '1'

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories')
      .then(({ data }) => setCategories(data.categories))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput === q) return
      setParams((current) => {
        const next = new URLSearchParams(current)
        if (searchInput.trim()) next.set('q', searchInput.trim())
        else next.delete('q')
        next.delete('page')
        return next
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput, q, setParams])

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get<Paginated<Item>>('/items', {
      params: { q, category_id: categoryId, item_type: itemType, status, sort, page, per_page: 12 },
    })
      .then(({ data }) => {
        if (!active) return
        setItems(data.data)
        setMeta(data.meta)
      })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [q, categoryId, itemType, status, sort, page, error])

  const setFilter = (key: string, value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    })
  }

  const clearFilters = () => {
    setSearchInput('')
    setParams(new URLSearchParams())
  }

  const hasFilters = Boolean(q || categoryId || itemType || status || sort !== 'latest')

  return (
    <div>
      <PageHeader title="Browse items" subtitle="Search reported lost and found items across campus." />

      <div className="app-card mb-5 space-y-3 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b09b8b]" size={18} />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, description or location…"
            className="pl-11"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
          <SlidersHorizontal size={14} /> Filters
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="ml-auto flex items-center gap-1 text-brown">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'lost', label: 'Lost' },
            { value: 'found', label: 'Found' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter('item_type', option.value)}
              className={cn(
                'chip flex-1 justify-center',
                itemType === option.value ? 'bg-brown text-white' : 'bg-cream text-brown',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={categoryId} onChange={(event) => setFilter('category_id', event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select value={status} onChange={(event) => setFilter('status', event.target.value)}>
            <option value="">Any status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="returned">Returned</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Select value={sort} onChange={(event) => setFilter('sort', event.target.value)}>
            <option value="latest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </Select>
        </div>
      </div>

      {meta && (
        <p className="mb-3 text-xs font-semibold text-muted">
          {meta.total} {meta.total === 1 ? 'item' : 'items'} found
        </p>
      )}

      {loading ? (
        <LoadingState label="Searching items…" />
      ) : items.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
          <Pagination meta={meta} onPage={(next) => setFilter('page', String(next))} />
        </>
      ) : (
        <EmptyState
          title="No items found"
          description="Try a different keyword or clear the filters to see more items."
          action={<button type="button" className="btn-secondary" onClick={clearFilters}>Clear filters</button>}
        />
      )}
    </div>
  )
}
