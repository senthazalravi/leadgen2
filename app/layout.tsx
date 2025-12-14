import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans, Instrument_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
})

export const metadata: Metadata = {
  title: 'Outrinsic - AI Lead Generation',
  description: 'AI-Powered Lead Generation for Scandinavian Markets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${instrumentSans.variable} font-body antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#1e293b',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#1e293b',
              },
            },
          }}
        />
      </body>
    </html>
  )
}

