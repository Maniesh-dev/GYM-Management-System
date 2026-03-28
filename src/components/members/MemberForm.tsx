'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberSchema, MemberInput } from '@/lib/validations/member.schema'
import toast from 'react-hot-toast'

interface Plan { id: string; name: string; price: number; durationDays: number }
interface Trainer { id: string; name: string }

interface MemberFormProps {
  plans: Plan[]
  trainers: Trainer[]
  // Pass existing member data to pre-fill for edit mode
  defaultValues?: Partial<MemberInput & { id: string }>
  mode: 'create' | 'edit'
}

export function MemberForm({
  plans,
  trainers,
  defaultValues,
  mode,
}: MemberFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // New Payment Fields
  const [recordPayment, setRecordPayment] = useState(false)
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [paymentRef, setPaymentRef] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: defaultValues ?? {
      joinDate: new Date().toISOString().split('T')[0],
    },
  })

  const selectedPlanId = watch('planId')

  async function onSubmit(values: MemberInput) {
    setSaving(true)
    setError('')

    const url = mode === 'create'
      ? '/api/members'
      : `/api/members/${defaultValues?.id}`

    const method = mode === 'create' ? 'POST' : 'PUT'

    try {
      const actionPromise = fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async (response) => {
        if (!response.ok) throw new Error('API Error')
        const data = await response.json()

        if (mode === 'create' && recordPayment) {
          const plan = plans.find(p => p.id === values.planId)
          await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberId: data.id,
              planId: values.planId,
              amount: plan?.price || 0,
              mode: paymentMode,
              referenceNo: paymentRef,
              paidAt: values.joinDate,
              sendReceipt: true,
            })
          })
        }

        return data
      })

      toast.promise(actionPromise, {
        loading: mode === 'create' ? 'Adding member...' : 'Saving changes...',
        success: mode === 'create' && recordPayment ? 'Member & Payment recorded!' : (mode === 'create' ? 'Member added successfully' : 'Member updated successfully'),
        error: mode === 'create' ? 'Failed to save' : 'Failed to update',
      })

      const data = await actionPromise

      if (mode === 'create') {
        router.push(`/dashboard/members/${data.id}`)
      } else {
        router.push(`/dashboard/members/${defaultValues?.id}`)
        router.refresh()
      }
    } catch (err) {
      setError('Please check all required fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  // Styles
  const lblClass = "block text-[13px] font-medium text-muted-foreground mb-1 mt-0"
  const inpClass = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm outline-none bg-background text-foreground box-border focus:ring-2 focus:ring-ring"
  const selClass = `${inpClass} cursor-pointer`
  const errClass = "text-xs text-red-600 dark:text-red-400 mt-1 m-0"
  const fldClass = "flex flex-col"
  const g2Class = "flex flex-col md:grid md:grid-cols-2 gap-4"

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >

      {/* Name + Phone */}
      <div className={g2Class}>
        <div className={fldClass}>
          <label className={lblClass}>Full name *</label>
          <input
            {...register('name')}
            placeholder="Enter full name"
            className={inpClass}
          />
          {errors.name && <p className={errClass}>{errors.name.message}</p>}
        </div>
        <div className={fldClass}>
          <label className={lblClass}>Phone number *</label>
          <input
            {...register('phone')}
            placeholder="Enter whatsapp number"
            maxLength={10}
            className={inpClass}
          />
          {errors.phone && <p className={errClass}>{errors.phone.message}</p>}
        </div>
      </div>

      {/* Email + DOB */}
      <div className={g2Class}>
        <div className={fldClass}>
          <label className={lblClass}>Email address</label>
          <input
            {...register('email')}
            type="email"
            placeholder="Enter email address"
            className={inpClass}
          />
        </div>
        <div className={fldClass}>
          <label className={lblClass}>Date of birth</label>
          <input
            {...register('dob')}
            type="date"
            className={inpClass}
          />
        </div>
      </div>

      {/* Plan + Join date */}
      <div className={g2Class}>
        <div className={fldClass}>
          <label className={lblClass}>Membership plan *</label>
          <select
            defaultValue={defaultValues?.planId ?? ''}
            onChange={e => setValue('planId', e.target.value)}
            className={selClass}
          >
            <option value="" disabled>Select a plan</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — ₹{p.price} ({p.durationDays} days)
              </option>
            ))}
          </select>
          {errors.planId && <p className={errClass}>{errors.planId.message}</p>}
        </div>
        <div className={fldClass}>
          <label className={lblClass}>Join date *</label>
          <input
            {...register('joinDate')}
            type="date"
            className={inpClass}
          />
        </div>
      </div>

      {/* Trainer */}
      <div className={fldClass}>
        <label className={lblClass}>Assign trainer (optional)</label>
        <select
          defaultValue={defaultValues?.trainerId ?? ''}
          onChange={e => setValue('trainerId', e.target.value)}
          className={selClass}
        >
          <option value="">No trainer assigned</option>
          {trainers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Address */}
      <div className={fldClass}>
        <label className={lblClass}>Address</label>
        <textarea
          {...register('address')}
          placeholder="Home address"
          rows={2}
          className={`${inpClass} resize-y`}
        />
      </div>

      {/* Emergency contact */}
      <div className={fldClass}>
        <label className={lblClass}>Emergency contact</label>
        <input
          {...register('emergencyContact')}
          placeholder="Parent name — 9876543210"
          className={inpClass}
        />
      </div>

      {mode === 'create' && (
        <div className="p-5 border border-border rounded-xl bg-muted/50 mt-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="m-0 text-[15px] font-semibold text-foreground">Initial Payment</h3>
              <p className="m-0 mt-1 text-[13px] text-muted-foreground">Record the first payment for this member.</p>
            </div>
            <button
              type="button"
              onClick={() => setRecordPayment(!recordPayment)}
              className="px-3.5 py-1.5 text-[13px] rounded-lg border border-border bg-background text-foreground cursor-pointer font-medium hover:bg-muted transition-colors"
            >
              {recordPayment ? 'Cancel payment' : '+ Record payment'}
            </button>
          </div>

          {recordPayment && (
            <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4">
              <div className={g2Class}>
                <div className={fldClass}>
                  <label className={lblClass}>Payment mode *</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    className={selClass}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div className={fldClass}>
                  <label className={lblClass}>Reference No (optional)</label>
                  <input
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder={paymentMode === 'UPI' ? 'e.g. 402112345678' : paymentMode === 'CARD' ? 'e.g. 4242' : 'e.g. 001234'}
                    className={inpClass}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 8,
          background: '#fef2f2',
          border: '0.5px solid #fca5a5',
          fontSize: 13,
          color: '#991b1b',
        }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
        <button
          type="submit"
          disabled={saving}
          className={`px-7 py-2.5 rounded-lg border-none text-sm font-semibold transition-colors ${saving ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-foreground text-background cursor-pointer hover:opacity-90'}`}
        >
          {saving
            ? (mode === 'create' ? 'Adding...' : 'Saving...')
            : (mode === 'create' ? 'Add member' : 'Save changes')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-lg border border-border bg-card text-sm text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>

    </form>
  )
}