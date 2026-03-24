import { redirect } from 'next/navigation'

// Placeholder route.
// The app generates receipts via `/api/payments/[id]/receipt`; if you meant a full
// "record details" page, you can build it here later.
export default async function BillingRecordPage() {
  redirect('/dashboard/billing')
}
