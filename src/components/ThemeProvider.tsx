'use client'

import * as React from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'
type ThemeAttribute = 'class' | `data-${string}`

type ThemeContextValue = {
    theme: Theme
    resolvedTheme: ResolvedTheme
    setTheme: (theme: Theme) => void
}

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    enableSystem?: boolean
    attribute?: ThemeAttribute
    storageKey?: string
    disableTransitionOnChange?: boolean
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme() {
    if (typeof window === 'undefined') {
        return 'light' as const
    }
    return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light'
}

function getStoredTheme(storageKey: string, fallback: Theme) {
    if (typeof window === 'undefined') {
        return fallback
    }
    try {
        const value = localStorage.getItem(storageKey)
        if (value === 'light' || value === 'dark' || value === 'system') {
            return value
        }
    } catch {
        // Ignore storage failures (private mode, disabled storage, etc.)
    }
    return fallback
}

function disableTransitions() {
    const style = document.createElement('style')
    style.appendChild(
        document.createTextNode(
            '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}',
        ),
    )
    document.head.appendChild(style)
    return () => {
        window.getComputedStyle(document.body)
        setTimeout(() => {
            document.head.removeChild(style)
        }, 1)
    }
}

function applyTheme(attribute: ThemeAttribute, resolvedTheme: ResolvedTheme, disableTransitionOnChange: boolean) {
    const root = document.documentElement
    const cleanup = disableTransitionOnChange ? disableTransitions() : null

    if (attribute === 'class') {
        root.classList.remove('light', 'dark')
        root.classList.add(resolvedTheme)
    } else {
        root.setAttribute(attribute, resolvedTheme)
    }

    root.style.colorScheme = resolvedTheme
    cleanup?.()
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    enableSystem = true,
    attribute = 'class',
    storageKey = 'theme',
    disableTransitionOnChange = false,
}: ThemeProviderProps) {
    const [theme, setThemeState] = React.useState<Theme>(() => getStoredTheme(storageKey, defaultTheme))
    const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(getSystemTheme)

    React.useEffect(() => {
        const media = window.matchMedia(SYSTEM_THEME_QUERY)
        const update = (event?: MediaQueryListEvent) => {
            const matchesDark = event ? event.matches : media.matches
            setSystemTheme(matchesDark ? 'dark' : 'light')
        }

        update()
        media.addEventListener('change', update)
        return () => media.removeEventListener('change', update)
    }, [])

    const resolvedTheme: ResolvedTheme =
        theme === 'system' && enableSystem ? systemTheme : (theme as ResolvedTheme)

    React.useEffect(() => {
        applyTheme(attribute, resolvedTheme, disableTransitionOnChange)
    }, [attribute, resolvedTheme, disableTransitionOnChange])

    const setTheme = React.useCallback(
        (nextTheme: Theme) => {
            setThemeState(nextTheme)
            try {
                localStorage.setItem(storageKey, nextTheme)
            } catch {
                // Ignore storage failures (private mode, disabled storage, etc.)
            }
        },
        [storageKey],
    )

    const value = React.useMemo(
        () => ({
            theme,
            resolvedTheme,
            setTheme,
        }),
        [theme, resolvedTheme, setTheme],
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = React.useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}
