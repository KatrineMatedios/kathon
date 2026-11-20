import { ChevronDown, HelpCircle, Mail, MapPin, MessageCircle, Phone, Search, Send } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import api, { getErrorMessage } from '../../api/client'
import { Button, Card, Field, Input, PageHeader, Textarea } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { SupportTicket } from '../../types'
import { cn, formatDate } from '../../utils'

const faqs = [
  {
    question: 'How do I report a lost item?',
    answer: 'Open the Report button in the bottom navigation, choose “Report Lost Item”, fill in the item details, date, location and optionally upload photos. Your report starts as pending until an administrator reviews it.',
  },
  {
    question: 'How do I report an item I found?',
    answer: 'Tap the Report button and choose “Report Found Item”. Describe the item, where and when you found it, and upload a clear photo. This helps the owner recognize their belongings quickly.',
  },
  {
    question: 'How do I claim an item?',
    answer: 'Open the item from Browse, tap “Claim item”, explain why it belongs to you and upload proof of ownership. An administrator reviews every claim before approving it.',
  },
  {
    question: 'What do the report statuses mean?',
    answer: 'Pending means admin review is ongoing. Approved means the report is visible to everyone. Returned or Resolved means the item has been handed back. Rejected means the report did not pass review.',
  },
  {
    question: 'How long does approval take?',
    answer: 'Most reports are reviewed within one school day. You will receive a notification as soon as the status changes.',
  },
]

const steps = [
  { icon: Search, title: 'Report or browse', text: 'Submit a report or search recently reported items.' },
  { icon: MessageCircle, title: 'Claim or contact', text: 'Explain ownership or message the reporter directly.' },
  { icon: HelpCircle, title: 'Admin verification', text: 'An administrator checks the proof and approves the claim.' },
]

export function Help() {
  const { success, error } = useToast()
  const [open, setOpen] = useState<number | null>(0)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [form, setForm] = useState({ subject: '', message: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api.get<{ data: SupportTicket[] }>('/support-tickets')
      .then(({ data }) => setTickets(data.data ?? []))
      .catch(() => undefined)
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    try {
      const { data } = await api.post<{ message: string }>('/support-tickets', form)
      success(data.message)
      setForm({ subject: '', message: '' })
      const { data: list } = await api.get<{ data: SupportTicket[] }>('/support-tickets')
      setTickets(list.data ?? [])
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Help & support" subtitle="Find answers or send us a message." />

      <Card className="p-5">
        <h2 className="text-base font-extrabold text-ink">How CampusFind works</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="soft-card p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brown">
                  <Icon size={18} />
                </span>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted">Step {index + 1}</p>
                <p className="mt-1 text-sm font-extrabold text-ink">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{step.text}</p>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-[#f0e3d0] p-5">
          <h2 className="text-base font-extrabold text-ink">Frequently asked questions</h2>
        </div>
        {faqs.map((faq, index) => (
          <div key={faq.question} className={cn(index > 0 && 'border-t border-[#f2e8db]')}>
            <button
              type="button"
              onClick={() => setOpen(open === index ? null : index)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <span className="text-sm font-bold text-ink">{faq.question}</span>
              <ChevronDown size={17} className={cn('shrink-0 text-muted transition', open === index && 'rotate-180')} />
            </button>
            {open === index && <p className="px-4 pb-4 text-xs leading-relaxed text-muted">{faq.answer}</p>}
          </div>
        ))}
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-extrabold text-ink">Submit a support request</h2>
        <p className="mt-1 text-xs text-muted">Describe your issue and an administrator will respond.</p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Subject">
            <Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="e.g. Cannot upload photo" required />
          </Field>
          <Field label="Message">
            <Textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Tell us what happened…" required />
          </Field>
          <Button type="submit" loading={sending}><Send size={16} /> Send request</Button>
        </form>

        {tickets.length > 0 && (
          <div className="mt-6 space-y-2 border-t border-[#f2e8db] pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Your requests</p>
            {tickets.map((ticket) => (
              <div key={ticket.id} className="soft-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{ticket.subject}</p>
                  <span className="chip bg-brown-light text-brown">{ticket.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{formatDate(ticket.created_at)}</p>
                {ticket.admin_response && <p className="mt-2 rounded-xl bg-white p-2 text-xs text-ink">{ticket.admin_response}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-extrabold text-ink">Contact information</h2>
        <div className="mt-4 space-y-3 text-sm text-muted">
          <p className="flex items-center gap-3"><Mail size={17} className="text-brown" /> support@campusfind.local</p>
          <p className="flex items-center gap-3"><Phone size={17} className="text-brown" /> (02) 8123 4567</p>
          <p className="flex items-center gap-3"><MapPin size={17} className="text-brown" /> Student Services Building, Room 101</p>
        </div>
      </Card>
    </div>
  )
}
