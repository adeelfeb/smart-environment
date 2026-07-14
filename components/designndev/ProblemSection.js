'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { AlertTriangle, Clock, Copy, EyeOff } from 'lucide-react'

const problems = [
  {
    icon: AlertTriangle,
    title: 'Incomplete Location Details',
    description: 'Phone calls and emails often lack precise location information, making it hard for authorities to locate waste issues quickly.',
  },
  {
    icon: Clock,
    title: 'Delayed Responses',
    description: 'Manual complaint handling leads to slow processing times, with citizens waiting days or weeks for any acknowledgment.',
  },
  {
    icon: Copy,
    title: 'Duplicate Complaints',
    description: 'Without a centralized system, the same issue gets reported multiple times by different citizens, wasting resources.',
  },
  {
    icon: EyeOff,
    title: 'No Visibility',
    description: 'Citizens have no way to track complaint progress or verify whether action has been taken on their reports.',
  },
]

export default function ProblemSection() {
  return (
    <section className="py-16 md:py-24 relative bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-emerald-600 text-sm font-semibold uppercase tracking-wider mb-3">
              The Problem
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
              Current waste reporting is{' '}
              <span className="text-emerald-600">broken</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Environment activists corporations often rely on phone calls, emails, or manual reporting methods to receive waste-related complaints. These approaches suffer from incomplete location details, delayed responses, and lack of visibility.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {problems.map((problem, i) => (
                <motion.div
                  key={problem.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <problem.icon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{problem.title}</h4>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">{problem.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl"
          >
            <Image
              src="/images/waste-pollution.jpg"
              alt="Waste pollution problem"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
