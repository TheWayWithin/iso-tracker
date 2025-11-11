import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ISO Tracker',
  description: 'Evidence-based analysis of interstellar objects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
