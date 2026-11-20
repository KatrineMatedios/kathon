import { Eye, EyeOff, LockKeyhole, Mail, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Button, Field, Input } from '../../components/ui'

export function Login() {
  const { login } = useAuth()
  const { error } = useToast()
  const navigate = useNavigate()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const signedInUser = await login(loginValue.trim(), password)
      navigate(signedInUser.role === 'admin' ? '/admin' : '/home', { replace: true })
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream px-5 py-8 lg:flex lg:items-center lg:justify-center lg:px-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-45px_rgba(96,53,31,0.7)] lg:grid-cols-2">
        <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-brown p-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brown-light text-lg font-extrabold text-brown">CF</span>
              <span className="text-xl font-extrabold">CampusFind</span>
            </div>
            <h1 className="mt-16 text-4xl font-extrabold leading-tight">
              Every lost thing<br />finds its way back.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#e8d8c8]">
              Report lost belongings, help classmates find what they misplaced, and keep your campus community connected.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-xs">
            <div className="absolute -left-8 -top-10 h-24 w-24 rounded-full bg-brown-light/20" />
            <div className="absolute -right-6 bottom-2 h-16 w-16 rounded-full bg-sage/30" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-8 backdrop-blur">
              <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-cream">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brown-light">
                  <Search size={48} className="text-brown" />
                  <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-sage text-white">✓</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#cbb5a3]">A smarter way to manage lost and found on campus.</p>
        </div>

        <div className="flex min-h-[620px] flex-col justify-center px-6 py-10 sm:px-12">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brown text-sm font-extrabold text-white">CF</span>
              <span className="text-lg font-extrabold text-brown">CampusFind</span>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Welcome back</p>
          <h2 className="mt-2 text-3xl font-extrabold text-brown">Sign in to your account</h2>
          <p className="mt-2 text-sm text-muted">Use your student email or student ID to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="Student email or ID">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b09b8b]" size={18} />
                <Input
                  value={loginValue}
                  onChange={(event) => setLoginValue(event.target.value)}
                  placeholder="student@school.edu or STU2024001"
                  className="pl-11"
                  autoComplete="username"
                  required
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b09b8b]" size={18} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="px-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:bg-cream"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-bold text-brown hover:underline">Forgot password?</Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>Sign in</Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-extrabold text-brown hover:underline">Create account</Link>
          </p>
          <div className="mt-6 rounded-2xl bg-cream p-3 text-center text-[11px] leading-relaxed text-muted">
            Demo accounts: <strong>student@campusfind.local / Student@123</strong>
            <br /><strong>admin@campusfind.local / Admin@12345</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
