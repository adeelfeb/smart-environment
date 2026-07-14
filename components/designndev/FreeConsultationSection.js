'use client'

import { motion } from 'framer-motion'
import LetsChatForm from './LetsChatForm'

export default function FreeConsultationSection({ animated = true }) {
  const content = (
    <>
      <div className="text-left flex flex-col justify-center min-h-0">
        <p className="text-emerald-600 text-sm md:text-base uppercase tracking-wider font-subheading mb-4">
          Help keep our communities clean
        </p>
        <h2 className="section-heading font-heading text-3xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-6 text-left normal-case leading-tight">
          Report a <span className="text-emerald-600">waste issue</span>
        </h2>
        <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-subheading max-w-lg">
          Upload a geotagged photo and our system will automatically route your complaint to the correct administrator for review and resolution.
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 p-6 md:p-8 bg-white shadow-xl flex flex-col min-h-0">
        <LetsChatForm />
      </div>
    </>
  )

  if (!animated) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
        {content}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-left flex flex-col justify-center min-h-0"
      >
        <p className="text-emerald-600 text-sm md:text-base uppercase tracking-wider font-subheading mb-4">
          Help keep our communities clean
        </p>
        <h2 className="section-heading font-heading text-3xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-6 text-left normal-case leading-tight">
          Report a <span className="text-emerald-600">waste issue</span>
        </h2>
        <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-subheading max-w-lg">
          Upload a geotagged photo and our system will automatically route your complaint to the correct administrator for review and resolution.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-200 p-6 md:p-8 bg-white shadow-xl flex flex-col min-h-0"
      >
        <LetsChatForm />
      </motion.div>
    </div>
  )
}
