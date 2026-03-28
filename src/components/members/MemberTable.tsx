'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addMonths } from 'date-fns'
import { formatDate, daysUntil } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import { useRole } from '@/hooks/useRole'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Member {
  id: string
  name: string
  phone: string
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED'
  expiryDate: Date
  joinDate: Date
  plan: { name: string; price: number }
  trainerId: string | null
  trainer: { name: string } | null
  _count: { checkins: number }
}

interface TrainerOption {
  id: string
  name: string
}

interface MemberTableProps {
  members: Member[]
  trainers: TrainerOption[]
}

const DURATION_OPTIONS = [1, 3, 6, 12] as const

function getAllowedDurations(expiryDate: Date | string) {
  const now = new Date()
  const expiry = new Date(expiryDate)
  return DURATION_OPTIONS.filter((months) => addMonths(now, months) <= expiry)
}

export function MemberTable({ members, trainers }: MemberTableProps) {
  const router = useRouter()
  const { role } = useRole()
  const isTrainer = role === 'TRAINER'
  const canAssignTrainer = role === 'OWNER' || role === 'RECEPTION'

  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedTrainerId, setSelectedTrainerId] = useState('')
  const [selectedMonths, setSelectedMonths] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')

  function openAssignDialog(member: Member) {
    const allowedDurations = getAllowedDurations(member.expiryDate)
    setSelectedMember(member)
    setSelectedTrainerId('')
    setSelectedMonths(allowedDurations.length > 0 ? String(allowedDurations[0]) : '')
    setAssignError('')
    setAssignOpen(true)
  }

  async function handleAssignTrainer() {
    if (!selectedMember) return
    if (!selectedTrainerId) {
      setAssignError('Please select a trainer')
      return
    }
    if (!selectedMonths) {
      setAssignError('Please select a duration')
      return
    }

    setAssigning(true)
    setAssignError('')

    const res = await fetch(`/api/members/${selectedMember.id}/assign-trainer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainerId: selectedTrainerId,
        months: Number(selectedMonths),
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setAssignError(data?.error ?? 'Failed to assign trainer')
      setAssigning(false)
      return
    }

    setAssignOpen(false)
    setSelectedMember(null)
    setSelectedTrainerId('')
    setSelectedMonths('')
    setAssigning(false)
    router.refresh()
  }

  if (members.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-sm text-muted-foreground mb-2 mt-0">
          No members found
        </p>
        <p className="text-[13px] text-muted-foreground/60 m-0">
          Try adjusting your search or filter
        </p>
      </div>
    )
  }

  const allowedDurations = selectedMember ? getAllowedDurations(selectedMember.expiryDate) : []
  const isAlreadyAssignedTrainerSelected = Boolean(
    selectedMember?.trainerId && selectedTrainerId && selectedMember.trainerId === selectedTrainerId
  )

  return (
    <>
      {/* Card grid: visible below lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:hidden">
        {members.map(m => {
          const days = daysUntil(m.expiryDate)
          const urgent = m.status === 'ACTIVE' && days >= 0 && days <= 7

          return (
            <div
              key={m.id}
              className="bg-card border border-border rounded-xl flex flex-col overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card body */}
              <div className="flex flex-col gap-3 p-4 flex-1">

                {/* Name + status row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-[15px] m-0 truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-muted-foreground m-0 mt-0.5">
                      {m.phone}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">

                  <div>
                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide font-medium m-0 mb-0.5">
                      Plan
                    </p>
                    <p className="text-foreground/90 font-medium m-0 truncate">{m.plan.name}</p>
                    <p className="text-[11px] text-muted-foreground m-0">₹{m.plan.price}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide font-medium m-0 mb-0.5">
                      Expiry
                    </p>
                    <p className={`m-0 font-medium ${urgent ? 'text-red-600 dark:text-red-400' : 'text-foreground/90'}`}>
                      {formatDate(m.expiryDate)}
                    </p>
                    {urgent && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-bold m-0">
                        {days === 0 ? 'Expires today' : `${days}d left`}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide font-medium m-0 mb-0.5">
                      Check-ins
                    </p>
                    <p className="text-foreground/90 font-medium m-0">{m._count.checkins}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide font-medium m-0 mb-0.5">
                      Trainer
                    </p>
                    <p className="text-foreground/90 font-medium m-0 truncate">
                      {m.trainer?.name ?? (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </p>
                  </div>

                </div>
              </div>

              {/* Card footer - actions */}
              {!isTrainer && (
                <div className="border-t border-border px-4 py-2.5 bg-muted/40">
                  <div className="flex items-center justify-between gap-2">
                    {canAssignTrainer && (
                      <button
                        type="button"
                        onClick={() => openAssignDialog(m)}
                        className="text-[13px] font-semibold text-foreground bg-transparent border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-background transition-colors"
                      >
                        {m.trainer ? 'Change trainer' : 'Assign trainer'}
                      </button>
                    )}
                    <Link
                      href={`/dashboard/members/${m.id}`}
                      className="text-[13px] font-semibold text-primary no-underline hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Table: visible at lg and above */}
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border">
              {['Member', 'Plan', 'Status', 'Expiry', 'Check-ins', 'Trainer', !isTrainer && ''].filter(Boolean).map(h => (
                <th
                  key={h as string}
                  className="p-3.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap bg-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const days = daysUntil(m.expiryDate)
              const urgent = m.status === 'ACTIVE' && days >= 0 && days <= 7
              const td = 'p-4 border-b border-border align-middle'

              return (
                <tr key={m.id}>

                  {/* Member name + phone */}
                  <td className={td}>
                    <p className="font-semibold text-foreground m-0 mb-1">{m.name}</p>
                    <p className="text-xs text-muted-foreground m-0">{m.phone}</p>
                  </td>

                  {/* Plan */}
                  <td className={td}>
                    <p className="text-foreground/80 m-0 mb-0.5">{m.plan.name}</p>
                    <p className="text-[11px] text-muted-foreground m-0">₹{m.plan.price}</p>
                  </td>

                  {/* Status */}
                  <td className={td}>
                    <StatusBadge status={m.status} />
                  </td>

                  {/* Expiry */}
                  <td className={`${td} whitespace-nowrap`}>
                    <p className={`m-0 mb-0.5 ${urgent ? 'text-red-600 dark:text-red-400' : 'text-foreground/80'}`}>
                      {formatDate(m.expiryDate)}
                    </p>
                    {urgent && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-bold m-0">
                        {days === 0 ? 'Expires today' : `${days}d left`}
                      </p>
                    )}
                  </td>

                  {/* Check-in count */}
                  <td className={`${td} text-muted-foreground text-center`}>
                    {m._count.checkins}
                  </td>

                  {/* Trainer */}
                  <td className={`${td} text-muted-foreground`}>
                    {m.trainer?.name ?? (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  {!isTrainer && (
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        {canAssignTrainer && (
                          <button
                            type="button"
                            onClick={() => openAssignDialog(m)}
                            className={`text-[13px] font-semibold text-foreground bg-transparent border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-muted transition-colors whitespace-nowrap ${m.trainer ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}
                          >
                            {m.trainer ? 'Change trainer' : 'Assign trainer'}
                          </button>
                        )}
                        <Link
                          href={`/dashboard/members/${m.id}`}
                          className="text-[13px] font-semibold text-primary no-underline whitespace-nowrap hover:underline"
                        >
                          View →
                        </Link>
                      </div>
                    </td>
                  )}

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open)
          if (!open) {
            setAssignError('')
            setAssigning(false)
          }
        }}
      >
        <DialogContent style={{ maxWidth: 460 }}>
          <DialogHeader>
            <DialogTitle>Assign trainer</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <div className="text-sm text-muted-foreground">
              {selectedMember ? `Member: ${selectedMember.name}` : ''}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-muted-foreground">Trainer *</label>
              <select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm outline-none bg-background text-foreground box-border focus:ring-2 focus:ring-ring"
              >
                <option value="">Select trainer</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}{selectedMember?.trainerId === trainer.id ? ' (Already assigned)' : ''}
                  </option>
                ))}
              </select>
              {isAlreadyAssignedTrainerSelected && (
                <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                  Already assigned
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-muted-foreground">Duration *</label>
              <select
                value={selectedMonths}
                onChange={(e) => setSelectedMonths(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm outline-none bg-background text-foreground box-border focus:ring-2 focus:ring-ring"
                disabled={allowedDurations.length === 0}
              >
                {allowedDurations.length === 0 ? (
                  <option value="">No valid duration (membership expires too soon)</option>
                ) : (
                  allowedDurations.map((months) => (
                    <option key={months} value={months}>
                      {months} month{months > 1 ? 's' : ''}
                    </option>
                  ))
                )}
              </select>
              <p className="m-0 text-xs text-muted-foreground">
                Duration cannot exceed member plan expiry date.
              </p>
            </div>

            {assignError && (
              <p className="m-0 text-xs text-red-600 dark:text-red-400">{assignError}</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAssignTrainer}
                disabled={assigning || !selectedMember || trainers.length === 0 || allowedDurations.length === 0}
                className="px-4 py-2 rounded-lg border-none text-sm font-semibold transition-colors bg-foreground text-background cursor-pointer hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning...' : 'Assign trainer'}
              </button>
              <button
                type="button"
                onClick={() => setAssignOpen(false)}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
