'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const [email, setEmail] = useState('owner@fightclub.com')
    const [password, setPassword] = useState('maniesh@123')
    const [loading, setLoading] = useState(false)
    const [debugLog, setDebugLog] = useState<string[]>([])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setDebugLog([])

        try {
            const result = await signIn('credentials', {
                email: email.trim().toLowerCase(),
                password: password,
                redirect: false,
            })

            if (!result) {
                toast.error('No response from server')
                setLoading(false)
                return
            }

            if (result.error) {

                const errorMessages: Record<string, string> = {
                    CredentialsSignin: 'Wrong email or password',
                    Configuration: 'Server config error — check AUTH_SECRET in .env.local',
                    AccessDenied: 'Access denied',
                    Verification: 'Verification error',
                    Default: 'Login failed',
                }

                toast.error(errorMessages[result.error] ?? `Error: ${result.error}`)
                setLoading(false)
                return
            }

            if (result.ok) {
                toast.success('Login successful!')
                window.location.href = '/dashboard'
                return
            }

            toast.error('Unexpected error')
            setLoading(false)

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            toast.error(`Exception: ${message}`)
            setLoading(false)
        }
    }

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f5f5f3; }
                input:focus { border-color: #6366f1 !important; outline: none; }
            `}</style>

            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                background: '#f5f5f3',
            }}>
                <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Login card */}
                    <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        border: '1px solid #e5e7eb',
                        padding: '40px 36px',
                    }}>

                        {/* Logo */}
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <div style={{
                                width: 52, height: 52,
                                background: '#111827',
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 14px',
                            }}>
                                <span style={{ color: '#fff', fontSize: 24, fontWeight: 900 }}>F</span>
                            </div>
                            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                                Fight Club Jaipur
                            </h1>
                            <p style={{ fontSize: 14, color: '#6b7280' }}>
                                Sign in to your dashboard
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    required
                                    autoComplete="email"
                                    autoFocus
                                    disabled={loading}
                                    style={{
                                        padding: '11px 14px',
                                        borderRadius: 10,
                                        border: '1px solid #d1d5db',
                                        fontSize: 15,
                                        color: '#111827',
                                        background: '#fff',
                                        width: '100%',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    disabled={loading}
                                    style={{
                                        padding: '11px 14px',
                                        borderRadius: 10,
                                        border: '1px solid #d1d5db',
                                        fontSize: 15,
                                        color: '#111827',
                                        background: '#fff',
                                        width: '100%',
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    width: '100%',
                                    padding: '13px 0',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: loading ? '#6b7280' : '#111827',
                                    color: '#fff',
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    marginTop: 4,
                                }}
                            >
                                {loading && (
                                    <span style={{
                                        width: 16, height: 16,
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin .7s linear infinite',
                                    }} />
                                )}
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>

                        </form>

                    </div>
                </div>
            </div>
        </>
    )
}

