import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../../components/ui'
import { getErrorMessage, getValidationErrors } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export function Register() {
  const { register } = useAuth()
  const { error } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    student_id: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validation, setValidation] = useState<Record<string, string[]>>({})

  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setValidation({})
    try {
      await register(form)
      navigate('/registered', { replace: true, state: { name: form.name } })
    } catch (err) {
      setValidation(getValidationErrors(err))
      error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fieldError = (key: string) => validation[key]?.[0]

  return (
    <div className="min-h-screen bg-cream px-5 py-7">
      <div className="mx-auto w-full max-w-xl">
        <Link to="/login" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-brown">
          <ArrowLeft size={17} /> Back to sign in
        </Link>

        <div className="app-card overflow-hidden">
          <div className="bg-brown px-6 py-7 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ddc8b6]">Join CampusFind</p>
            <h1 className="mt-1 text-2xl font-extrabold">Create your account</h1>
            <p className="mt-2 text-sm text-[#e8d8c8]">It only takes a minute to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <Field label="Full name" hint={fieldError('name')}>
              <Input value={form.name} onChange={update('name')} placeholder=" Juan Dela Cruz" required />
            </Field>
            <Field label="Student ID" hint={fieldError('student_id')}>
              <Input value={form.student_id} onChange={update('student_id')} placeholder="STU2024001" required />
            </Field>
            <Field label="School email" hint={fieldError('email')}>
              <Input type="email" value={form.email} onChange={update('email')} placeholder="you@school.edu" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password" hint={fieldError('password') ?? 'At least 8 characters'}>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={update('password')}
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:bg-cream"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm password">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password_confirmation}
                  onChange={update('password_confirmation')}
                  placeholder="Repeat password"
                  required
                />
              </Field>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>Create account</Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="font-extrabold text-brown hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
