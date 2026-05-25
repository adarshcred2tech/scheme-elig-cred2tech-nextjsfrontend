import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { MsmeAuthProvider } from '@/contexts/MsmeAuthContext'
import { SchemesProvider } from '@/contexts/SchemesContext'
import { Providers } from '@/components/providers'
import ToasterProvider from '@/components/toaster-provider'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'MSME Scheme Discovery Platform',
  description: 'Discover and apply for government schemes for small and medium enterprises',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <MsmeAuthProvider>
            <SchemesProvider>
              {children}
            </SchemesProvider>
          </MsmeAuthProvider>
        </Providers>
        <ToasterProvider />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
