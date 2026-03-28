import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

export function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString('en-IN')}`
}

export function daysUntil(date: Date | string) {
    const diff = new Date(date).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Returns a robust YYYY-MM-DD string in Asia/Kolkata timezone.
 * Works regardless of the server's local timezone.
 */
export function getISTDateString(date: Date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date)

    const year = parts.find((p) => p.type === 'year')?.value
    const month = parts.find((p) => p.type === 'month')?.value
    const day = parts.find((p) => p.type === 'day')?.value

    if (!year || !month || !day) {
        throw new Error('Failed to build IST date string')
    }

    return `${year}-${month}-${day}`
}

/**
 * Returns the formal start/end of a given date (YYYY-MM-DD formatted) in IST.
 * Returns absolute UTC Date objects.
 */
export function getISTDayBoundaries(dateStr: string) {
    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : getISTDateString()
    // Construct ISO strings with IST offset (+05:30)
    const dayStart = new Date(`${safeDate}T00:00:00+05:30`)
    const dayEnd = new Date(`${safeDate}T23:59:59+05:30`)
    return { dayStart, dayEnd }
}

/**
 * Returns the formal start of the day in India Standard Time (IST).
 * This correctly handles the 5.5 hour offset relative to UTC.
 */
export function getISTStartOfDay() {
    const istDate = getISTDateString()
    return new Date(`${istDate}T00:00:00+05:30`)
}

/**
 * Returns current date/time adjusted for IST display on server components.
 */
export function getISTDate() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
}
