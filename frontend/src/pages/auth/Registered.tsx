import { Check, PartyPopper } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export function Registered() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const name = (location.state as { name?: string } | null)?.name ?? 'there'

  const continueToLogin = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5 py-8">
      <div className="app-card w-full max-w-md p-8 text-center">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-sage/20">
          <PartyPopper className="text-[#2f6d42]" size={44} />
          <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-sage text-white">
            <Check size={20} strokeWidth={3} />
          </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Registration complete</p>
        <h1 className="mt-2 text-3xl font-extrabold text-brown">Welcome, {name.split(' ')[0]}!</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your CampusFind account has been created successfully. You can now report lost items, help return found items, and track your claims.
        </p>

        <div className="mt-6 space-y-2 rounded-2xl bg-cream p-4 text-left text-sm text-muted">
          <p className="flex items-center gap-2"><Check size={15} className="text-sage" /> Account saved in the MySQL database</p>
          <p className="flex items-center gap-2"><Check size={15} className="text-sage" /> You can submit and track reports</p>
          <p className="flex items-center gap-2"><Check size={15} className="text-sage" /> Notifications are enabled</p>
        </div>

        <Button fullWidth size="lg" className="mt-7" onClick={continueToLogin}>Continue to login</Button>
      </div>
    </div>
  )
}
