import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Header } from '@/components/header'

export const metadata: Metadata = {
  title: {
    default: 'ISO Tracker - Evidence-Based Interstellar Object Analysis',
    template: '%s | ISO Tracker',
  },
  description: 'Track and analyze interstellar objects with evidence-based methodology. Join the community evaluating scientific claims about 1I/\'Oumuamua, 2I/Borisov, and 3I/ATLAS.',
  keywords: ['interstellar objects', 'ISO', 'astronomy', 'evidence analysis', 'Oumuamua', 'Borisov', 'ATLAS'],
  authors: [{ name: 'ISO Tracker Team' }],
  creator: 'ISO Tracker',
  publisher: 'ISO Tracker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://iso-tracker.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'ISO Tracker',
    title: 'ISO Tracker - Evidence-Based Interstellar Object Analysis',
    description: 'Track and analyze interstellar objects with evidence-based methodology.',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ISO Tracker - Evidence-Based Interstellar Object Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ISO Tracker',
    description: 'Evidence-based analysis platform for interstellar objects',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ISO Tracker',
  },
}

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="ISO Tracker" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ISO Tracker" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1e3a5f" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="min-h-screen bg-slate-900 text-slate-100">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
