'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { paymentSchema, PaymentInput } from '@/lib/validations/payment.schema'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'


const REF_LABEL: Record<string, string> = {
    UPI: 'UPI transaction ID',
    CARD: 'Card last 4 digits',
    CHEQUE: 'Cheque number',
    CASH: 'Cash',

}

interface Props {
    members: { id: string; name: string; phone: string; planId: string }[]
    plans: { id: string; name: string; price: number }[]
    preselectedMemberId?: string

}

export function PaymentFormDialog({ members, plans, preselectedMemberId }: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [searchQuery, setSearchQuery] = useState(() => {
        if (preselectedMemberId) {
            const m = members.find(x => x.id === preselectedMemberId)
            return m ? `${m.name} — ${m.phone}` : ''
        }
        return ''
    })
    const [showSuggestions, setShowSuggestions] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const [discountValue, setDiscountValue] = useState('')
    const [discountType, setDiscountType] = useState('FIXED')

    const filteredMembers = members.filter(m =>
        m.phone.includes(searchQuery) || m.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const form = useForm<PaymentInput>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            memberId: preselectedMemberId ?? '',
            mode: 'CASH',
            sendReceipt: true,
            paidAt: new Date().toISOString().split('T')[0],
        },
    })

    const mode = form.watch('mode')
    const planIdWatch = form.watch('planId')
    const showRef = ['UPI', 'CARD', 'CHEQUE'].includes(mode)

    useEffect(() => {
        if (!planIdWatch) return
        const plan = plans.find(p => p.id === planIdWatch)
        if (!plan) return

        let newAmount = plan.price
        const dVal = Number(discountValue)
        if (!isNaN(dVal) && dVal > 0) {
            if (discountType === 'FIXED') {
                newAmount = Math.max(0, plan.price - dVal)
            } else {
                newAmount = Math.max(0, plan.price - (plan.price * dVal / 100))
            }
        }
        form.setValue('amount', newAmount)
    }, [planIdWatch, discountValue, discountType, plans, form])

    function handleMemberChange(memberId: string | null) {
        if (!memberId) return
        form.setValue('memberId', memberId)
        const member = members.find(m => m.id === memberId)
        if (member) {
            const plan = plans.find(p => p.id === member.planId)
            if (plan) {
                form.setValue('planId', plan.id)
                form.setValue('amount', plan.price)
            }
        }
    }

    function handlePlanChange(planId: string | null) {
        if (!planId) return
        form.setValue('planId', planId)
        const plan = plans.find(p => p.id === planId)
        if (plan) form.setValue('amount', plan.price)
    }

    async function onSubmit(values: PaymentInput) {
        setSaving(true)
        setError('')

        let finalNote = values.note || ''
        const dVal = Number(discountValue)
        if (dVal > 0) {
            const discountStr = discountType === 'FIXED' ? `₹${dVal}` : `${dVal}%`
            const discountNote = `Discount applied: ${discountStr}`
            finalNote = finalNote ? `${finalNote} (${discountNote})` : discountNote
        }

        const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...values,
                amount: Number(values.amount),
                note: finalNote,
            }),
        })
        if (!res.ok) {
            const _ = await res.json()
            setError('Failed to record payment')
            setSaving(false)
        } else {
            setOpen(false)
            form.reset()
            router.refresh()
        }
    }

    const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
    const err: React.CSSProperties = { fontSize: 12, color: 'var(--color-text-danger)' }
    const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className={`${buttonVariants()} h-10 font-bold active:scale-[0.98] transition-all`}>
                + Record payment
            </DialogTrigger>
            <DialogContent style={{ maxWidth: 520 }}>
                <DialogHeader>
                    <DialogTitle>Record payment</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>

                    {/* Member */}
                    <div style={field}>
                        <Label>Member *</Label>
                        <div className="relative w-full" ref={wrapperRef}>
                            <Input
                                placeholder="Type a name or phone number..."
                                value={searchQuery}
                                onFocus={() => setShowSuggestions(true)}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    form.setValue('memberId', '') // clear form value
                                    setShowSuggestions(true)
                                }}
                                className='cursor-pointer w-full'
                            />
                            {showSuggestions && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-md max-h-60 overflow-auto">
                                    {filteredMembers.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-zinc-500 text-center">No members found</div>
                                    ) : (
                                        filteredMembers.map(m => (
                                            <div
                                                key={m.id}
                                                className="px-3 py-2 cursor-pointer hover:bg-zinc-100 text-sm flex justify-between items-center"
                                                onClick={() => {
                                                    handleMemberChange(m.id)
                                                    setSearchQuery(`${m.name} — ${m.phone}`)
                                                    setShowSuggestions(false)
                                                }}
                                            >
                                                <span className="font-medium text-zinc-900">{m.name}</span>
                                                <span className="text-zinc-500 text-xs">{m.phone}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {form.formState.errors.memberId && (
                            <p style={err}>{form.formState.errors.memberId.message}</p>
                        )}
                    </div>

                    {/* Plan */}
                    <div style={field}>
                        <Label>Plan *</Label>
                        <Select onValueChange={handlePlanChange}>
                            <SelectTrigger className='w-full'><SelectValue placeholder="Select plan" /></SelectTrigger>
                            <SelectContent>
                                {plans.map(p => (
                                    <SelectItem key={p.id} value={`${p.name} — ₹${p.price}`}>
                                        {p.name} — ₹{p.price}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.planId && (
                            <p style={err}>{form.formState.errors.planId.message}</p>
                        )}
                    </div>

                    {/* Discount & Amount */}
                    <div style={grid2}>
                        <div style={field}>
                            <Label>Discount</Label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Input
                                    type="number"
                                    value={discountValue}
                                    onChange={e => setDiscountValue(e.target.value)}
                                    placeholder="0"
                                    style={{ flex: 1 }}
                                />
                                <Select value={discountType} onValueChange={v => setDiscountType(v || 'FIXED')}>
                                    <SelectTrigger style={{ width: 90 }}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FIXED">₹</SelectItem>
                                        <SelectItem value="PERCENTAGE">%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div style={field}>
                            <Label>Final Amount (₹) *</Label>
                            <Input type="number" {...form.register('amount')} placeholder="0" />
                            {form.formState.errors.amount && (
                                <p style={err}>{form.formState.errors.amount.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Mode + Date */}
                    <div style={grid2}>
                        <div style={field}>
                            <Label>Payment mode *</Label>
                            <Select
                                defaultValue="CASH"
                                onValueChange={v => form.setValue('mode', v as PaymentInput['mode'])}
                            >
                                <SelectTrigger className='w-full'><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="CARD">Card</SelectItem>
                                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div style={field}>
                            <Label>Payment date</Label>
                            <Input type="date" {...form.register('paidAt')} />
                        </div>
                    </div>

                    {/* Reference number */}
                    {showRef && (
                        <div style={field}>
                            <Label>{REF_LABEL[mode]} (optional)</Label>
                            <Input
                                {...form.register('referenceNo')}
                                placeholder={
                                    mode === 'UPI' ? 'e.g. 402112345678' :
                                        mode === 'CARD' ? 'e.g. 4242' : 'e.g. 001234'
                                }
                            />
                        </div>
                    )}

                    {/* Note */}
                    <div style={field}>
                        <Label>Note (optional)</Label>
                        <Textarea {...form.register('note')} rows={2} placeholder="Any additional info" />
                    </div>

                    {/* Send WhatsApp receipt */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                        <input
                            type="checkbox"
                            defaultChecked
                            onChange={e => form.setValue('sendReceipt', e.target.checked)}
                            style={{ width: 15, height: 15 }}
                        />
                        Send WhatsApp receipt to member
                    </label>

                    {error && <p style={err}>{error}</p>}

                    <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                        <Button type="submit" disabled={saving} style={{ flex: 1 }}>
                            {saving ? 'Saving...' : 'Record payment'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                    </div>

                </form>
            </DialogContent>
        </Dialog>
    )
}