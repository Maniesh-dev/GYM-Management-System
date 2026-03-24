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