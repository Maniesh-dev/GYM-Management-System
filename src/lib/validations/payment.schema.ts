import { z } from 'zod'

export const paymentSchema = z.object({
    memberId: z.string().min(1),
    planId: z.string().min(1, 'Select a plan'),
    amount: z.number().positive('Enter valid amount'),
    mode: z.enum(['CASH', 'UPI', 'CARD', 'CHEQUE']),
    referenceNo: z.string().optional(),
    note: z.string().optional(),
    paidAt: z.string().optional(),
    sendReceipt: z.boolean(),
})

export type PaymentInput = z.infer<typeof paymentSchema>