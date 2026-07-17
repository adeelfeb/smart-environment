'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

function useRouterCompat() {
  const [pathname, setPathname] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
      const scheduleUpdate = () => {
        queueMicrotask(() => setPathname(window.location.pathname))
      }
      window.addEventListener('popstate', scheduleUpdate)
      const op = history.pushState
      const or = history.replaceState
      history.pushState = function (...args) {
        op.apply(history, args)
        scheduleUpdate()
      }
      history.replaceState = function (...args) {
        or.apply(history, args)
        scheduleUpdate()
      }
      return () => {
        window.removeEventListener('popstate', scheduleUpdate)
        history.pushState = op
        history.replaceState = or
      }
    }
  }, [])
  return { asPath: pathname, pathname }
}

export default function Navbar() {
  const router = useRouterCompat()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isActive = (href) => {
    if (!isMounted) return false
    const pathname = router.asPath || router.pathname
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about-us', label: 'About Us' },
    { href: '/faq', label: 'FAQ' },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 overflow-visible transition-all duration-300"
      >
        <div className="relative w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
          <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 items-center h-[var(--fc-navbar-height)]">
              {/* Left: Hamburger + About Us (desktop) */}
              <div className="flex justify-start items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-gray-700 hover:text-emerald-600 rounded-lg transition-colors touch-manipulation"
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMenuOpen}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
                <Link
                  href="/about-us"
                  className="hidden lg:block text-sm font-medium text-gray-600 hover:text-emerald-600 no-underline transition-colors"
                >
                  About Us
                </Link>
              </div>

              {/* Center: Logo */}
              <div className="flex justify-center">
                <Link href="/" className="flex items-center no-underline hover:opacity-90 transition-opacity">
                  <img
                    src="/logo.svg"
                    alt="EcoWatch"
                    width={180}
                    height={48}
                    loading="eager"
                    className="h-8 sm:h-9 md:h-10 w-auto"
                  />
                </Link>
              </div>

              {/* Right: Sign In / Sign Up */}
              <div className="hidden sm:flex justify-end items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-emerald-600 no-underline transition-colors py-2 px-3"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-fc-primary text-sm py-2 px-4 no-underline"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Menu overlay — solid white background */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 bottom-0 z-40 bg-white top-[var(--fc-navbar-height)] shadow-2xl overflow-auto"
            aria-hidden="false"
          >
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
              {/* Mobile: Sign In / Sign Up inside menu */}
              <div className="sm:hidden mb-6 flex gap-3">
                <Link
                  href="/login"
                  className="flex-1 text-center text-base font-medium text-gray-700 hover:text-emerald-600 border border-gray-200 rounded-xl py-3.5 no-underline"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-fc-primary flex-1 text-center text-base py-3.5 no-underline"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2 w-full max-w-[1200px]">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`block py-4 px-2 text-2xl md:text-4xl font-semibold no-underline transition-colors border-b border-gray-100 ${
                        isActive(item.href) ? 'text-emerald-600' : 'text-gray-900 hover:text-emerald-600'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
