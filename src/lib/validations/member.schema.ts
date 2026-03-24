import { z } from 'zod'

export const memberSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().regex(/^\d{10}$/, 'Enter valid 10-digit number'),
    email: z.string().email().optional().or(z.literal('')),
    dob: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    planId: z.string().min(1, 'Select a plan'),
    trainerId: z.string().optional(),
    joinDate: z.string(),
})

export type MemberInput = z.infer<typeof memberSchema>