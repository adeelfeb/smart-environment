import Head from 'next/head'
import { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Eye, EyeOff, ShieldCheck, Recycle, MapPin } from 'lucide-react'
import Navbar from '../components/designndev/Navbar'
import Footer from '../components/designndev/Footer'
import { AuthCardSkeleton } from '../components/Skeleton'
import { safeParseJsonResponse } from '../utils/safeJsonResponse'
import { siteName } from '../lib/siteConfig'

function formatErrorMessage(payload, fallback) {
  if (!payload) return fallback
  const detail =
    typeof payload.error === 'string'
      ? payload.error
      : Array.isArray(payload.error)
      ? payload.error.join(', ')
      : ''
  if (detail) {
    return `${payload.message || fallback}: ${detail}`
  }
  return payload.message || fallback
}

const ERROR_HINTS = {
  NO_DB_URI: 'The MONGODB_URI environment variable is not set on the server. Add it to your deployment\'s environment variables and redeploy.',
  CONNECTION_TIMEOUT: 'The database server took too long to respond. Check that MongoDB Atlas is running and that its IP access list allows connections from your deployment.',
  DNS_RESOLUTION_FAILED: 'The server cannot resolve the database hostname. Verify the MONGODB_URI is correct and the deployment has internet access.',
  AUTHENTICATION_FAILED: 'The database rejected the credentials in MONGODB_URI. Check the username and password in the connection string.',
  DB_UNAVAILABLE: 'The database service is temporarily unreachable. This may be a transient issue — try again in a moment.',
  NO_JWT_SECRET: 'The JWT_SECRET environment variable is not set on the server. Add it to your deployment\'s environment variables and redeploy.',
  TOKEN_SIGN_FAILED: 'The server could not generate an authentication token. The JWT_SECRET may be invalid or missing.',
  LOGIN_FAILED: 'An unexpected error occurred while processing your sign-in. Check the server logs for details.',
  UNHANDLED_ERROR: 'The server encountered an unhandled error. This may be caused by a missing environment variable or a deployment issue.',
}

const NON_JSON_ERROR_HINT =
  'The server returned an error page instead of a valid response. This usually means the serverless function crashed or failed to start. Common causes: missing environment variables (MONGODB_URI, JWT_SECRET), MongoDB Atlas IP access list blocking the deployment, or the function exceeded its time limit.'

function shouldSkipAuthRedirect() {
  if (typeof window === 'undefined') return false
  const redirectKey = 'auth_redirect_count'
  const redirectTimeKey = 'auth_redirect_time'
  const now = Date.now()
  const lastRedirectTime = parseInt(sessionStorage.getItem(redirectTimeKey) || '0', 10)
  const redirectCount = parseInt(sessionStorage.getItem(redirectKey) || '0', 10)
  if (now - lastRedirectTime > 5000) {
    sessionStorage.setItem(redirectKey, '0')
    sessionStorage.setItem(redirectTimeKey, String(now))
    return false
  }
  if (redirectCount >= 2) {
    console.warn('[Login] Redirect loop detected, clearing auth state')
    localStorage.removeItem('token')
    sessionStorage.removeItem(redirectKey)
    sessionStorage.removeItem(redirectTimeKey)
    return true
  }
  return false
}

function incrementRedirectCount() {
  if (typeof window === 'undefined') return
  const redirectKey = 'auth_redirect_count'
  const redirectTimeKey = 'auth_redirect_time'
  const count = parseInt(sessionStorage.getItem(redirectKey) || '0', 10)
  sessionStorage.setItem(redirectKey, String(count + 1))
  sessionStorage.setItem(redirectTimeKey, String(Date.now()))
}

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const hasCheckedAuth = useRef(false)

  useEffect(() => {
    if (!router.isReady || hasCheckedAuth.current) return
    hasCheckedAuth.current = true

    async function checkAuth() {
      try {
        if (shouldSkipAuthRedirect()) {
          setCheckingAuth(false)
          return
        }
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) {
          setCheckingAuth(false)
          return
        }
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })
        if (!res.ok) {
          localStorage.removeItem('token')
          setCheckingAuth(false)
          return
        }
        const data = await safeParseJsonResponse(res)
        if (data.success && data.data && data.data.user) {
          if (data.data.token && typeof window !== 'undefined') {
            localStorage.setItem('token', data.data.token)
          }
          incrementRedirectCount()
          const redirectDestination = router.query.redirect || '/dashboard'
          if (redirectDestination === '/dashboard' || !router.query.redirect) {
            router.replace('/dashboard#submit-complaint')
          } else {
            router.replace(redirectDestination)
          }
          return
        } else {
          localStorage.removeItem('token')
        }
      } catch (err) {
        console.log('[Login] Auth check failed, showing login page:', err)
        localStorage.removeItem('token')
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router.isReady])

  const isDisabled = useMemo(() => {
    if (loading) return true
    const identifierValid = identifier.trim().length > 0
    const passwordValid = password.length >= 5
    return !identifierValid || !passwordValid
  }, [identifier, password, loading])

  async function onSubmit(e) {
    e.preventDefault()
    if (isDisabled) return
    setLoading(true)
    setError('')
    setErrorDetail('')

    try {
      const trimmedIdentifier = identifier.trim()
      const isEmail = trimmedIdentifier.includes('@')
      const loginPayload = { password }
      if (isEmail) {
        loginPayload.email = trimmedIdentifier
      } else {
        loginPayload.username = trimmedIdentifier
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginPayload),
      })

      const text = await res.text()
      let data = {}

      if (text && text.trim()) {
        try {
          data = JSON.parse(text)
        } catch (parseErr) {
          if (res.status >= 500) {
            setError('Server error (HTTP ' + res.status + ')')
            setErrorDetail(NON_JSON_ERROR_HINT)
          } else if (res.status === 0 || !res.ok) {
            setError('Unable to connect to the server. Please check your internet connection.')
          } else {
            setError("We couldn't sign you in. Please try again.")
          }
          setLoading(false)
          return
        }
      }

      if (!res.ok || !data.success) {
        const errorMessage = formatErrorMessage(data, "We couldn't sign you in. Please check your email/username and password.")
        setError(errorMessage)
        if (data.code && ERROR_HINTS[data.code]) {
          setErrorDetail(ERROR_HINTS[data.code])
        } else if (res.status >= 500) {
          setErrorDetail('This is a server-side error. Check the deployment environment variables and server logs.')
        }
        setLoading(false)
        return
      }

      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token)
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_redirect_count')
        sessionStorage.removeItem('auth_redirect_time')
      }
      const redirectDest = router.query.redirect || '/dashboard'
      if (redirectDest === '/dashboard' || !router.query.redirect) {
        router.replace('/dashboard#submit-complaint')
      } else {
        router.replace(redirectDest)
      }
    } catch (err) {
      console.error('[Login] Error during sign-in flow', err)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.')
      } else {
        setError(err.message || "We couldn't sign you in. Please check your credentials and try again.")
      }
      setErrorDetail('')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = 'block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all'
  const labelClass = 'text-sm font-medium text-gray-700 mb-1.5 block'

  if (checkingAuth) {
    return (
      <>
        <Head>
          <title>{`Sign In | ${siteName}`}</title>
          <meta name="description" content={`Sign in to your ${siteName} account.`} />
        </Head>
        <div className="min-h-screen bg-white">
          <Navbar />
          <main className="relative z-10 pt-20 pb-20 flex items-center justify-center min-h-[50vh]">
            <div className="w-full max-w-md mx-auto px-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 md:p-8">
                <AuthCardSkeleton />
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{`Sign In | ${siteName}`}</title>
        <meta name="description" content={`Sign in to your ${siteName} account.`} />
        <meta name="keywords" content="login, sign in, account, ecowatch" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 relative">
        <Navbar />
        <main className="relative z-10 pt-16 pb-24">
          <div className="max-w-lg mx-auto px-4 sm:px-6 text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200/50 mb-5">
              <Recycle className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-2 normal-case tracking-tight">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Sign in to manage waste reports and track complaint resolution.
            </p>
          </div>
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-emerald-100/60 shadow-xl shadow-emerald-900/5 p-5 md:p-8">
              {error && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm mb-6"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="text-red-700 font-medium">{error}</p>
                  {errorDetail && (
                    <p className="text-red-600/80 mt-1.5 text-xs leading-relaxed">{errorDetail}</p>
                  )}
                </div>
              )}

              <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
                <label>
                  <span className={labelClass}>Email</span>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="email"
                    id="login-identifier"
                    name="identifier"
                    placeholder="you@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={loading}
                    className={fieldClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Password</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      id="login-password"
                      name="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={5}
                      disabled={loading}
                      className={`${fieldClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={loading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 rounded-md disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                <button type="submit" disabled={isDisabled} className="btn-fc-primary w-full justify-center py-3">
                  {loading && (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
                  )}
                  <span>{loading ? 'Signing you in...' : 'Sign In'}</span>
                </button>
              </form>

              <footer className="mt-6 pt-5 border-t border-emerald-100/60 flex flex-wrap justify-center items-center gap-2 text-sm text-gray-500">
                <span>Need an account?</span>
                <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Create one here
                </Link>
              </footer>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/60 border border-emerald-100/40">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-[0.6rem] font-medium text-gray-500 text-center leading-tight">Secure &amp; Encrypted</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/60 border border-emerald-100/40">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span className="text-[0.6rem] font-medium text-gray-500 text-center leading-tight">Track in Real-Time</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/60 border border-emerald-100/40">
                <Recycle className="w-5 h-5 text-emerald-500" />
                <span className="text-[0.6rem] font-medium text-gray-500 text-center leading-tight">Eco-Friendly Reports</span>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
