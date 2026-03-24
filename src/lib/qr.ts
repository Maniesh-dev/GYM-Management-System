import QRCode from 'qrcode'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function generateMemberQR(qrToken: string): Promise<string> {
    // This is the URL embedded inside the QR code
    const url = `${BASE}/kiosk?token=${qrToken}&type=member`
    console.log('Generating member QR for URL:', url)
    return QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',  // High error correction — better scan reliability
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
    })
}

export async function generateTrainerQR(qrToken: string): Promise<string> {
    const url = `${BASE}/kiosk?token=${qrToken}&type=trainer`
    console.log('Generating trainer QR for URL:', url)
    return QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
    })
}
