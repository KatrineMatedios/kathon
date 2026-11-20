import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import api, { getErrorMessage, getValidationErrors } from '../../api/client'
import { Button, EmptyState, Field, Input, LoadingState, Modal, PageHeader, Textarea } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { Category } from '../../types'

const emptyForm = { name: '', icon: '', description: '' }

export function AdminCategories() {
  const { success, error } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [validation, setValidation] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.get<{ categories: Category[] }>('/admin/categories')
      .then(({ data }) => setCategories(data.categories))
      .catch((err) => error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [error])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setValidation({})
    setOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category.id)
    setForm({ name: category.name, icon: category.icon ?? '', description: category.description ?? '' })
    setValidation({})
    setOpen(true)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setValidation({})
    try {
      if (editing) {
        const { data } = await api.put(`/admin/categories/${editing}`, form)
        success(data.message)
      } else {
        const { data } = await api.post('/admin/categories', form)
        success(data.message)
      }
      setOpen(false)
      load()
    } catch (err) {
      setValidation(getValidationErrors(err))
      error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!window.confirm('Delete this category? Items in it will become uncategorized.')) return
    setBusy(id)
    try {
      const { data } = await api.delete<{ message: string }>(`/admin/categories/${id}`)
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
      <PageHeader
        title="Manage categories"
        subtitle="Organize how students classify lost and found items."
        action={<Button onClick={openCreate}><Plus size={16} /> Add category</Button>}
      />

      {loading ? (
        <LoadingState label="Loading categories…" />
      ) : categories.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id} className="app-card p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brown-light text-lg font-extrabold text-brown">
                  {category.name.charAt(0)}
                </span>
                <span className={`chip ${category.is_active === false ? 'bg-blush/20 text-[#a4483f]' : 'bg-sage/20 text-[#2f6d42]'}`}>
                  {category.is_active === false ? 'Inactive' : 'Active'}
                </span>
              </div>
              <h3 className="mt-3 text-base font-extrabold text-ink">{category.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{category.description ?? 'No description provided.'}</p>
              <div className="mt-4 flex gap-2 border-t border-[#f2e8db] pt-3">
                <Button size="sm" variant="outline" fullWidth onClick={() => openEdit(category)}><Edit3 size={14} /> Edit</Button>
                <Button size="sm" variant="danger" loading={busy === category.id} onClick={() => remove(category.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No categories yet" action={<Button onClick={openCreate}>Add category</Button>} />
      )}

      <Modal open={open} title={editing ? 'Edit category' : 'Add category'} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" hint={validation.name?.[0]}>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label="Icon name" hint={validation.icon?.[0] ?? 'Optional short label, e.g. laptop'}>
            <Input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" fullWidth loading={saving}>{editing ? 'Save changes' : 'Create category'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
