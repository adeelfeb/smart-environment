'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { siteAssets } from '../../lib/siteAssets'
import { siteName } from '../../lib/siteConfig'

const services = [
  { label: 'Image-Based Reporting', href: '/about-us' },
  { label: 'GPS Auto-Location', href: '/about-us' },
  { label: 'Smart Complaint Routing', href: '/about-us' },
  { label: 'Analytics Dashboard', href: '/about-us' },
]

/** Matches pre–slim-header navbar logo scale (footer stays slightly more prominent than header) */
const FOOTER_LOGO_CLASS =
  'h-8 w-auto sm:h-8 md:h-9 lg:h-9 xl:h-10 object-contain'

function FooterNewsletter() {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) return
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), website_url: honeypot }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setMessage(data.message || 'Something went wrong. Please try again.')
        return
      }
      setStatus('success')
      setMessage(data.message || 'Thanks for subscribing.')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="mt-5 max-w-sm">
      <p className="font-subheading text-xs tracking-wide text-gray-400 uppercase mb-2">
        Email updates
      </p>
      <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status !== 'loading') {
              setStatus('idle')
              setMessage('')
            }
          }}
          placeholder="Your email"
          disabled={status === 'loading'}
          className="flex-1 min-w-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 font-subheading"
        />
        <input
          type="text"
          name="website_url"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-heading text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
        >
          {status === 'loading' ? '…' : 'Subscribe'}
        </button>
      </form>
      {message && (
        <p
          className={`mt-2 text-xs font-subheading ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  )
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <section className="py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-12 lg:justify-between lg:items-start">
            {/* Logo + email capture */}
            <div className="max-w-md shrink-0">
              <Link href="/" className="inline-flex items-center leading-none no-underline hover:opacity-90 transition-opacity">
                <Image
                  src={siteAssets.logo}
                  alt={siteName}
                  width={128}
                  height={40}
                  className={FOOTER_LOGO_CLASS}
                />
              </Link>
              <FooterNewsletter />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-10 flex-1 lg:max-w-3xl">
              {/* Menu */}
              <div>
                <h4 className="font-subheading font-medium text-gray-400 text-xs tracking-wide uppercase mb-3">Menu</h4>
                <ul className="space-y-2 text-sm font-subheading">
                  <li><Link href="/about-us" className="text-gray-400 hover:text-emerald-400 transition-colors no-underline">About Us</Link></li>
                  <li><Link href="/faq" className="text-gray-400 hover:text-emerald-400 transition-colors no-underline">FAQ</Link></li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-subheading font-medium text-gray-400 text-xs tracking-wide uppercase mb-3">Features</h4>
                <ul className="space-y-2 text-sm font-subheading">
                  {services.map((s) => (
                    <li key={s.label}>
                      <Link href={s.href} className="text-gray-400 hover:text-emerald-400 transition-colors no-underline">
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div className="col-span-2 sm:col-span-1">
                <h4 className="font-subheading font-medium text-gray-400 text-xs tracking-wide uppercase mb-3">Quick Links</h4>
                <ul className="space-y-2 text-sm font-subheading">
                  <li><Link href="/signup" className="text-gray-400 hover:text-emerald-400 transition-colors no-underline">Sign Up</Link></li>
                  <li><Link href="/login" className="text-gray-400 hover:text-emerald-400 transition-colors no-underline">Sign In</Link></li>
                  <li><Link href="/dashboard" className="text-gray-400 hover:text-emerald-400 transition-colors no-underline">Dashboard</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-3 md:py-4 border-t border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-xs font-subheading">
            © {currentYear} {siteName}. All rights reserved.
          </p>
        </div>
      </section>
    </footer>
  )
}
