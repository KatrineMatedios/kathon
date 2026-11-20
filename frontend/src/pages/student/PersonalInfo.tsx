import { ArrowLeft, Camera, MailCheck, ShieldAlert } from 'lucide-react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage, getValidationErrors } from '../../api/client'
import { Button, Field, Input, LoadingState, PageHeader } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { User } from '../../types'
import { initials } from '../../utils'

export function PersonalInfo() {
  const { user, setUser, isAdmin } = useAuth()
  const { success, error } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [validation, setValidation] = useState<Record<string, string[]>>({})
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [form, setForm] = useState({
    name: '',
    student_id: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    let active = true
    api.get<{ user: User }>('/profile')
      .then(({ data }) => {
        if (!active) return
        setUser(data.user)
        setForm({
          name: data.user.name,
          student_id: data.user.student_id ?? '',
          email: data.user.email,
          phone: data.user.phone ?? '',
        })
        setPhotoPreview(data.user.profile_photo_url)
      })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [error, setUser])

  useEffect(() => {
    if (!photo) return
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setValidation({})
    const payload = new FormData()
    payload.append('name', form.name)
    payload.append('email', form.email)
    payload.append('phone', form.phone)
    if (isAdmin) payload.append('student_id', form.student_id)
    if (photo) payload.append('profile_photo', photo)

    try {
      const { data } = await api.put<{
        message: string
        user: User
        verification_code?: string
        email_verification_required?: boolean
      }>('/profile', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUser(data.user)
      setPhoto(null)
      if (data.verification_code) setVerificationCode(data.verification_code)
      success(data.message)
    } catch (err) {
      setValidation(getValidationErrors(err))
      error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const sendCode = async () => {
    setVerifying(true)
    try {
      const { data } = await api.post<{ verification_code: string }>('/profile/email/code')
      setVerificationCode(data.verification_code)
      success('Verification code sent.')
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setVerifying(false)
    }
  }

  const verifyCode = async () => {
    setVerifying(true)
    try {
      const { data } = await api.post<{ user: User; message: string }>('/profile/email/verify', { code: codeInput })
      setUser(data.user)
      setVerificationCode('')
      setCodeInput('')
      success(data.message)
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return <LoadingState label="Loading profile…" />

  return (
    <div>
      <Link to="/profile" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-brown">
        <ArrowLeft size={17} /> Back to profile
      </Link>
      <PageHeader title="Personal information" subtitle="Keep your account details accurate and up to date." />

      <form onSubmit={handleSubmit} className="app-card space-y-5 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:text-left">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brown-light text-2xl font-extrabold text-brown">
            {photoPreview
              ? <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
              : initials(form.name)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-ink">Profile picture</p>
            <p className="mt-1 text-xs text-muted">JPG, PNG or WEBP · max 4MB</p>
            <label className="btn-outline mt-3 !py-2 !text-xs cursor-pointer">
              <Camera size={15} /> Choose photo
              <input type="file" accept="image/*" className="hidden" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" hint={validation.name?.[0]}>
            <Input value={form.name} onChange={update('name')} required />
          </Field>
          <Field label="Student ID" hint={isAdmin ? validation.student_id?.[0] : 'Only administrators can change a student ID.'}>
            <Input value={form.student_id} onChange={update('student_id')} disabled={!isAdmin} required={isAdmin} />
          </Field>
        </div>

        <Field label="School email" hint={validation.email?.[0]}>
          <Input type="email" value={form.email} onChange={update('email')} required />
        </Field>

        <Field label="Contact number" hint={validation.phone?.[0]}>
          <Input value={form.phone} onChange={update('phone')} placeholder="0910 000 0000" />
        </Field>

        {!user?.email_verified && (
          <div className="rounded-2xl border border-[#f0d9a8] bg-[#fffaf0] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-[#8a5a1f]">
              <MailCheck size={17} /> Verify your email
            </p>
            <p className="mt-1 text-xs text-muted">Enter the 6-character code sent to your email to verify this address.</p>
            {verificationCode && (
              <p className="mt-3 rounded-xl bg-white p-2 text-center font-mono text-lg font-extrabold tracking-widest text-brown">
                {verificationCode}
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input value={codeInput} onChange={(event) => setCodeInput(event.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} />
              <Button type="button" variant="secondary" onClick={verifyCode} disabled={codeInput.length !== 6 || verifying}>Verify</Button>
              <Button type="button" variant="outline" onClick={sendCode} loading={verifying}>Send code</Button>
            </div>
          </div>
        )}

        {user?.email_verified && (
          <div className="flex items-center gap-2 rounded-2xl bg-sage/10 p-3 text-xs font-bold text-[#2f6d42]">
            <MailCheck size={16} /> Email address verified
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={saving}>Save changes</Button>
      </form>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-brown-light/30 p-4 text-xs leading-relaxed text-brown">
        <ShieldAlert size={18} className="shrink-0" />
        Your student ID is linked to your reports and claims. Contact an administrator if it needs correction.
      </div>
    </div>
  )
}
