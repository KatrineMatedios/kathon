import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api, { getErrorMessage, getValidationErrors } from '../../api/client'
import { Button, Field, Input } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

export function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [validation, setValidation] = useState<Record<string, string[]>>({})

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setValidation({})
    try {
      await api.post('/reset-password', {
        email,
        token,
        password,
        password_confirmation: confirmation,
      })
      success('Password reset successfully. You can now sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      setValidation(getValidationErrors(err))
      error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5 py-8">
      <div className="app-card w-full max-w-md p-6 sm:p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brown-light text-brown">
          <KeyRound size={26} />
        </div>
        <h1 className="text-center text-2xl font-extrabold text-brown">Choose a new password</h1>
        <p className="mt-2 text-center text-sm text-muted">Use at least 8 characters for your new password.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Field label="Email address" hint={validation.email?.[0]}>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="Reset token" hint={validation.token?.[0]}>
            <Input value={token} onChange={(event) => setToken(event.target.value)} required />
          </Field>
          <Field label="New password" hint={validation.password?.[0]}>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          <Field label="Confirm new password">
            <Input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          </Field>
          <Button type="submit" fullWidth size="lg" loading={loading}>Reset password</Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Remembered it? <Link to="/login" className="font-extrabold text-brown hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
