import Link from 'next/link'

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column', gap: 16,
            background: 'var(--color-background-tertiary)',
        }}>
            <p style={{ fontSize: 72, fontWeight: 700, color: 'var(--color-border-secondary)', lineHeight: 1 }}>
                404
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 500 }}>Page not found</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                The page you are looking for does not exist.
            </p>
            <Link href="/dashboard" style={{
                padding: '10px 20px', borderRadius: 8, fontSize: 14,
                background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
                textDecoration: 'none', fontWeight: 500,
            }}>
                Go to dashboard
            </Link>
        </div>
    )
}