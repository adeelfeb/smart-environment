import { Poppins, Cormorant_Garamond } from 'next/font/google'
import '../styles/globals.css'
import { siteName, siteTagline, siteUrl } from '../lib/siteConfig'

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  title: `${siteName} | Waste Complaint & Monitoring System`,
  description: siteTagline,
  keywords: 'waste complaint, environment activists, GPS geotag, waste management, complaint tracking',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: `${siteName} | Waste Complaint & Monitoring System`,
    description: siteTagline,
    url: siteUrl,
    siteName,
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className={`${poppins.className} antialiased relative min-h-screen`} suppressHydrationWarning>
        {/* Static full-viewport background – all pages share this */}
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-gray-100"
          style={{ backgroundImage: 'url(/images/nature-green.jpg)' }}
          aria-hidden
        />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}

