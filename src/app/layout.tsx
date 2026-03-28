import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from '@/components/Providers'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fight Club | Gym Management',
  description: 'Gym management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            {children}
          </Providers>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}