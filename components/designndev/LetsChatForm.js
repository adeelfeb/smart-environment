'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Loader2, ChevronRight } from 'lucide-react'
import { useRecaptcha } from '../../utils/useRecaptcha'
import { safeParseJsonResponse } from '../../utils/safeJsonResponse'

export default function LetsChatForm() {
  const { execute: executeRecaptcha, isAvailable: recaptchaAvailable } = useRecaptcha()
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    telephone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (submitStatus) setSubmitStatus(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const recaptchaToken = recaptchaAvailable ? await executeRecaptcha() : null
    if (recaptchaAvailable && !recaptchaToken) {
      setSubmitStatus({ type: 'error', message: 'Security verification failed. Please refresh and try again.' })
      return
    }
    setIsSubmitting(true)
    setSubmitStatus(null)
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        message: formData.message.trim(),
      }
      if (recaptchaToken) payload.recaptchaToken = recaptchaToken
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await safeParseJsonResponse(response)
      if (response.ok) {
        setSubmitStatus({ type: 'success', message: data.message || 'Thank you! We will get back to you soon.' })
        setFormData({ email: '', name: '', telephone: '', message: '' })
      } else {
        setSubmitStatus({ type: 'error', message: data.message || 'Something went wrong. Please try again.' })
      }
    } catch (err) {
      setSubmitStatus({ type: 'error', message: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-subheading'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 relative">
        {isSubmitting && (
          <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-sm z-10 pointer-events-auto flex items-center justify-center" aria-hidden>
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
        )}
        <div>
          <label htmlFor="letschat-email" className={labelClass}>Email Address *</label>
          <input
            type="email"
            id="letschat-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="letschat-name" className={labelClass}>Full Name *</label>
          <input
            type="text"
            id="letschat-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="letschat-telephone" className={labelClass}>Phone *</label>
          <input
            type="tel"
            id="letschat-telephone"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="+234 800 000 0000"
          />
        </div>
        <div>
          <label htmlFor="letschat-message" className={labelClass}>Describe the Issue *</label>
          <textarea
            id="letschat-message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className={`${inputClass} resize-y min-h-[100px]`}
            placeholder="Describe the waste issue — location, type of waste, severity, any photos to attach later..."
          />
        </div>
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={!isSubmitting ? { scale: 1.01 } : {}}
          whileTap={!isSubmitting ? { scale: 0.99 } : {}}
          className="w-full py-3 px-4 text-sm font-semibold text-white bg-emerald-600 border border-emerald-500 rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <>Submit Report <ChevronRight className="w-4 h-4" /></>
          )}
        </motion.button>
        <AnimatePresence mode="wait">
          {submitStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-4 rounded-lg border ${submitStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}
            >
              <p className="text-sm font-medium">{submitStatus.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  )
}
