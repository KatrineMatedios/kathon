import { ArrowLeft, FileCheck2, ShieldCheck, UploadCloud } from 'lucide-react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage, getValidationErrors } from '../../api/client'
import { Button, Field, ItemImage, LoadingState, Textarea } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { Claim, Item } from '../../types'

export function ClaimItem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reason, setReason] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [proofName, setProofName] = useState('')
  const [validation, setValidation] = useState<Record<string, string[]>>({})
  const [claim, setClaim] = useState<Claim | null>(null)

  useEffect(() => {
    let active = true
    api.get<Item>(`/items/${id}`)
      .then(({ data }) => { if (active) setItem(data) })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, error])

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setProof(file)
    setProofName(file?.name ?? '')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setValidation({})
    const payload = new FormData()
    payload.append('item_id', String(id))
    payload.append('reason', reason)
    if (proof) payload.append('proof', proof)

    try {
      const { data } = await api.post<{ claim: Claim }>('/claims', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setClaim(data.claim)
      success('Claim submitted successfully.')
    } catch (err) {
      setValidation(getValidationErrors(err))
      error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState label="Loading item…" />
  if (!item) return <div className="app-card p-8 text-center text-muted">Item not found.</div>

  if (claim) {
    return (
      <div className="app-card mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/20 text-[#2f6d42]">
          <FileCheck2 size={32} />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-brown">Claim submitted!</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          An administrator will review your proof of ownership. You can track the status in the Claims section.
        </p>
        <div className="mt-5 rounded-2xl bg-cream p-4 text-left text-sm">
          <p className="text-muted">Reference code</p>
          <p className="mt-1 font-mono text-lg font-extrabold tracking-widest text-brown">{claim.verification_code}</p>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button fullWidth onClick={() => navigate('/claims')}>Track my claim</Button>
          <Button fullWidth variant="outline" onClick={() => navigate(`/items/${item.id}`)}>Back to item</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link to={`/items/${item.id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-brown">
        <ArrowLeft size={17} /> Back to item
      </Link>

      <div className="app-card mb-5 flex gap-4 p-4">
        <ItemImage src={item.image_url} type={item.item_type} alt={item.item_name} className="h-24 w-24 shrink-0 rounded-2xl" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{item.item_type} item</p>
          <h1 className="mt-1 text-lg font-extrabold text-ink">{item.item_name}</h1>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="app-card space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl bg-brown-light/40 p-4">
          <ShieldCheck className="text-brown" size={22} />
          <p className="text-xs leading-relaxed text-brown">
            Only claim items that are truly yours. False claims may result in account suspension.
          </p>
        </div>

        <Field label="Why do you believe this item is yours?" hint={validation.reason?.[0] ?? 'Describe unique marks, contents, or where you lost it.'}>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="I lost this item near… It has a small sticker on the back…"
            className="min-h-36"
            required
          />
        </Field>

        <div>
          <span className="field-label">Proof of ownership</span>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-[#d9c4aa] bg-[#fffdf9] px-4 py-7 text-center text-muted transition hover:border-brown hover:bg-cream">
            <UploadCloud size={28} className="text-brown" />
            <span className="text-sm font-bold text-ink">{proofName || 'Upload a photo or document'}</span>
            <span className="text-xs">Optional · JPG, PNG or WEBP</span>
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          {validation.proof?.[0] && <p className="mt-1 text-xs text-[#a4483f]">{validation.proof[0]}</p>}
        </div>

        <Button type="submit" fullWidth size="lg" loading={submitting}>Submit claim</Button>
      </form>
    </div>
  )
}
