import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api, { getErrorMessage } from '../../api/client'
import { Button, LoadingState, PageHeader } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { Claim, Paginated } from '../../types'
import { formatDateTime } from '../../utils'

export function Verification() {
  const { code = '' } = useParams()
  const { isAdmin } = useAuth()
  const { error } = useToast()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [verification, setVerification] = useState<{ valid: boolean; verified_at: string } | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)

    const request = isAdmin
      ? api.get<Claim & { verification: { valid: boolean; verified_at: string } }>(`/claims/verify/${code}`)
      : api.get<Paginated<Claim>>('/claims', { params: { per_page: 100 } }).then((response) => {
        const found = response.data.data.find((item) => item.verification_code === code)
        if (!found) throw new Error('No claim found for this verification code.')
        return { data: found }
      })

    request
      .then(({ data }) => {
        if (!active) return
        setClaim((data as { data?: Claim }).data ?? (data as Claim))
        const verification = (data as { verification?: { valid: boolean; verified_at: string } }).verification
        if (verification) setVerification(verification)
      })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [code, isAdmin, error])

  if (loading) return <LoadingState label="Verifying claim…" />
  if (!claim) {
    return (
      <div className="app-card p-8 text-center">
        <XCircle className="mx-auto text-blush" size={38} />
        <p className="mt-3 font-bold text-ink">Invalid verification code</p>
        <Link to="/claims" className="btn-secondary mt-4">Back to claims</Link>
      </div>
    )
  }

  const valid = claim.status === 'approved' && (!verification || verification.valid)

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Claim verification" subtitle="Show this screen to an administrator to complete the return." />

      <div className="app-card overflow-hidden text-center">
        <div className={valid ? 'bg-[#f1faf3]' : 'bg-[#fff2f0]'}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            {valid ? <CheckCircle2 className="text-sage" size={34} /> : <XCircle className="text-blush" size={34} />}
          </div>
          <h2 className="mt-3 text-xl font-extrabold text-brown">
            {valid ? 'Approved claim' : 'Not approved'}
          </h2>
          <p className="mt-1 px-6 text-sm text-muted">
            {valid ? 'This claim has been verified by an administrator.' : 'This claim has not been approved.'}
          </p>
        </div>

        <div className="p-6">
          <div className="mx-auto w-fit rounded-3xl border border-[#eadcc8] bg-white p-5 shadow-sm">
            <QRCodeSVG value={`CAMPUSFIND:${code}`} size={180} fgColor="#60351F" bgColor="#FFFFFF" level="M" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-muted">Verification code</p>
          <p className="mt-1 font-mono text-2xl font-extrabold tracking-[0.25em] text-brown">{code}</p>

          <div className="mt-6 space-y-2 rounded-2xl bg-cream p-4 text-left text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted">Item</span>
              <span className="text-right font-bold text-ink">{claim.item?.item_name ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">Claimant</span>
              <span className="text-right font-bold text-ink">{claim.claimant?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">Status</span>
              <span className="font-bold capitalize text-ink">{claim.status}</span>
            </div>
            {verification && (
              <div className="flex justify-between gap-3">
                <span className="text-muted">Verified at</span>
                <span className="text-right font-bold text-ink">{formatDateTime(verification.verified_at)}</span>
              </div>
            )}
          </div>

          {isAdmin && !verification && (
            <Button
              className="mt-5"
              fullWidth
              onClick={() => api.get(`/claims/verify/${code}`).then(({ data }) => setVerification(data.verification))}
            >
              <ShieldCheck size={17} /> Verify now
            </Button>
          )}

          <Link to="/claims" className="btn-outline mt-3 w-full">Back to claims</Link>
        </div>
      </div>
    </div>
  )
}
