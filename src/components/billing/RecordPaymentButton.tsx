'use client'
import { PaymentFormDialog } from './PaymentForm'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function RecordPaymentButton({
    memberId,
}: {
    memberId: string
}) {
    const { data: members } = useSWR('/api/members?status=ACTIVE', fetcher)
    const { data: plans } = useSWR('/api/plans', fetcher)

    if (!members || !plans) return null

    return (
        <PaymentFormDialog
            members={members}
            plans={plans}
            preselectedMemberId={memberId}
        />
    )
}