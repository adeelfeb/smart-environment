'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Camera, MapPin, Send, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: Camera,
    step: '01',
    title: 'Upload a Photo',
    description: 'Snap a photo of the waste issue using your smartphone camera. The image is automatically geotagged with GPS coordinates.',
    color: 'emerald',
  },
  {
    icon: MapPin,
    step: '02',
    title: 'Auto-Capture Location',
    description: 'GPS coordinates are extracted from the image metadata, pinpointing the exact location without manual address entry.',
    color: 'blue',
  },
  {
    icon: Send,
    step: '03',
    title: 'Smart Routing',
    description: 'The system identifies the responsible corporation and ward, then routes the complaint to the correct administrator.',
    color: 'violet',
  },
  {
    icon: CheckCircle,
    step: '04',
    title: 'Track Resolution',
    description: 'Monitor your complaint status in real time from submission through review to resolution. Full transparency guaranteed.',
    color: 'amber',
  },
]

const colorMap = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
}

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 relative bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <p className="text-emerald-600 text-sm font-semibold uppercase tracking-wider mb-3">
            How It Works
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
            Report waste in{' '}
            <span className="text-emerald-600">4 simple steps</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Our system makes it easy for citizens to report waste issues and track resolution in real time.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, i) => {
            const colors = colorMap[step.color]
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <step.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Step {step.step}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-200" />
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 relative rounded-2xl overflow-hidden shadow-2xl aspect-[21/9] max-w-5xl mx-auto"
        >
          <Image
            src="/images/phone-report.jpg"
            alt="Report waste issue using smartphone"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 80vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/60 to-transparent flex items-center">
            <div className="p-8 md:p-12 max-w-lg">
              <h3 className="font-heading text-2xl md:text-3xl font-semibold text-white mb-3">
                Snap. Report. Track.
              </h3>
              <p className="text-white/80 text-base leading-relaxed">
                Citizens can report waste issues anytime, anywhere using just their smartphone camera.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
