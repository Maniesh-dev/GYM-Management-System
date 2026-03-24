export async function sendReceiptWhatsApp({
    phone, memberName, amount, mode, planName, expiryDate, gymName, referenceNo,
}: {
    phone: string; memberName: string; amount: number; mode: string
    planName: string; expiryDate: Date; gymName: string; referenceNo?: string
}) {
    const expiry = expiryDate.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    })

    const message =
        `Hi ${memberName}! 💪\n\n` +
        `✅ Payment received at ${gymName}\n\n` +
        `📋 Plan: ${planName}\n` +
        `💰 Amount: ₹${amount}\n` +
        `💳 Mode: ${mode}\n` +
        (referenceNo ? `🔖 Ref: ${referenceNo}\n` : '') +
        `📅 Valid till: ${expiry}\n\n` +
        `Thank you! See you at the gym. 🏋️`

    const res = await fetch(
        `${process.env.WATI_ENDPOINT}/api/v1/sendSessionMessage/${phone}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.WATI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messageText: message }),
        }
    )

    if (!res.ok) console.error('WhatsApp error:', await res.text())
}