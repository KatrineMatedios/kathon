import { ArrowLeft, ImagePlus, PackageSearch, SearchCheck, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage, getValidationErrors } from '../../api/client'
import { Button, Field, Input, PageHeader, Select, Textarea } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { Category, Item } from '../../types'
import { cn, todayInputValue } from '../../utils'

export function ReportItem() {
  const { type } = useParams<{ type: 'lost' | 'found' }>()
  const itemType = type === 'found' ? 'found' : 'lost'
  const navigate = useNavigate()
  const { success, error } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    item_name: '',
    category_id: '',
    description: '',
    lost_found_date: todayInputValue(),
    location: '',
    additional_information: '',
  })
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [validation, setValidation] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState<Item | null>(null)

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories')
      .then(({ data }) => setCategories(data.categories.filter((category) => category.is_active !== false)))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [files])

  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []).slice(0, 5)
    setFiles(selected)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setValidation({})

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value))
    files.forEach((file) => payload.append('images[]', file))

    try {
      const { data } = await api.post<{ item: Item; message: string }>(`/reports/${itemType}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSubmitted(data.item)
      success(data.message)
    } catch (err) {
      setValidation(getValidationErrors(err))
      error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fieldError = (key: string) => validation[key]?.[0]
  const Icon = itemType === 'lost' ? PackageSearch : SearchCheck

  if (submitted) {
    return (
      <div className="app-card mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/20 text-[#2f6d42]">
          <Icon size={32} />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-brown">Report submitted!</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your {itemType} item “{submitted.item_name}” has been saved and sent for admin review. You can track its progress in My Reports.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button fullWidth onClick={() => navigate('/my-reports')}>Track my report</Button>
          <Button fullWidth variant="outline" onClick={() => { setSubmitted(null); setForm({ item_name: '', category_id: '', description: '', lost_found_date: todayInputValue(), location: '', additional_information: '' }); setFiles([]) }}>
            Report another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link to="/home" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-brown">
        <ArrowLeft size={17} /> Back to home
      </Link>
      <PageHeader
        title={itemType === 'lost' ? 'Report a lost item' : 'Report a found item'}
        subtitle={itemType === 'lost' ? 'Tell us what you lost and where you last saw it.' : 'Help a classmate get their belonging back.'}
      />

      <form onSubmit={handleSubmit} className="app-card space-y-5 p-5 sm:p-6">
        <div className={cn('flex items-center gap-3 rounded-2xl p-4', itemType === 'lost' ? 'bg-blush/15' : 'bg-sage/15')}>
          <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-white', itemType === 'lost' ? 'text-[#a4483f]' : 'text-[#2f6d42]')}>
            <Icon size={22} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-ink">{itemType === 'lost' ? 'Lost item report' : 'Found item report'}</p>
            <p className="text-xs text-muted">Status will start as pending until an administrator reviews it.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Item name" hint={fieldError('item_name')}>
            <Input value={form.item_name} onChange={update('item_name')} placeholder="e.g. Black backpack" required />
          </Field>
          <Field label="Category" hint={fieldError('category_id')}>
            <Select value={form.category_id} onChange={update('category_id')} required>
              <option value="">Select a category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Description" hint={fieldError('description') ?? 'Include color, brand, size and identifying marks.'}>
          <Textarea value={form.description} onChange={update('description')} placeholder="Describe the item in detail…" required />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={itemType === 'lost' ? 'Date lost' : 'Date found'} hint={fieldError('lost_found_date')}>
            <Input type="date" value={form.lost_found_date} max={todayInputValue()} onChange={update('lost_found_date')} required />
          </Field>
          <Field label={itemType === 'lost' ? 'Location lost' : 'Location found'} hint={fieldError('location')}>
            <Input value={form.location} onChange={update('location')} placeholder="e.g. Library, 2nd floor" required />
          </Field>
        </div>

        <Field label="Additional information" hint={fieldError('additional_information') ?? 'Optional — any detail that could help identify the item.'}>
          <Textarea value={form.additional_information} onChange={update('additional_information')} placeholder="e.g. Name written inside, special marks…" />
        </Field>

        <div>
          <span className="field-label">Item image</span>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          {previews.length ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {previews.map((preview, index) => (
                <div key={preview} className="relative overflow-hidden rounded-2xl border border-[#eadcc8]">
                  <img src={preview} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    className="absolute right-1 top-1 rounded-full bg-brown p-1 text-white"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {files.length < 5 && (
                <button type="button" onClick={() => fileRef.current?.click()} className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-[#d9c4aa] text-muted hover:bg-cream">
                  <ImagePlus size={22} />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-[#d9c4aa] bg-[#fffdf9] px-4 py-8 text-muted transition hover:border-brown hover:bg-cream"
            >
              <ImagePlus size={28} className="text-brown" />
              <span className="text-sm font-bold text-ink">Upload item photos</span>
              <span className="text-xs">PNG, JPG or WEBP · up to 5 images</span>
            </button>
          )}
          {fieldError('images') && <p className="mt-1 text-xs text-[#a4483f]">{fieldError('images')}</p>}
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Submit report
        </Button>
      </form>
    </div>
  )
}
