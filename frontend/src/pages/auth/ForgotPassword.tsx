import { ArrowLeft, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client'
import { Button, Field, Input } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

export function ForgotPassword() {
  const { error } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ token: string; email: string } | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      await api.post('/forgot-password', { email })
      const { data } = await api.post<{ token: string; email: string }>('/dev/reset-token', { email })
      setResult(data)
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5 py-8">
      <div className="w-full max-w-md">
        <Link to="/login" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-brown">
          <ArrowLeft size={17} /> Back to sign in
        </Link>
        <div className="app-card p-6 sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brown-light text-brown">
            <MailCheck size={26} />
          </div>
          <h1 className="text-center text-2xl font-extrabold text-brown">Forgot your password?</h1>
          <p className="mt-2 text-center text-sm text-muted">
            Enter your account email and we'll prepare a password reset link.
          </p>

          {result ? (
            <div className="mt-6 rounded-2xl border border-sage/40 bg-[#f1faf3] p-4 text-sm">
              <p className="font-bold text-[#2f6d42]">Reset token ready</p>
              <p className="mt-1 text-[#4f7459]">
                This local development build shows the token directly because email delivery is not configured.
              </p>
              <code className="mt-3 block break-all rounded-xl bg-white px-3 py-2 text-xs font-bold text-brown">{result.token}</code>
              <Link
                to={`/reset-password?email=${encodeURIComponent(result.email)}&token=${encodeURIComponent(result.token)}`}
                className="btn-primary mt-4 w-full"
              >
                Continue to reset password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <Field label="Email address">
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@school.edu" required />
              </Field>
              <Button type="submit" fullWidth size="lg" loading={loading}>Send reset instructions</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
