'use client'

import { motion } from 'framer-motion'
import { Target, MapPin, Users, BarChart3, Clock, Database } from 'lucide-react'

const goals = [
  {
    icon: Target,
    title: 'Simplify Reporting',
    description: 'Make waste complaint reporting as easy as taking a photo. No more phone calls or emails.',
  },
  {
    icon: MapPin,
    title: 'GPS Auto-Capture',
    description: 'Automatically capture complaint location using GPS coordinates from uploaded photos.',
  },
  {
    icon: Users,
    title: 'Smart Routing',
    description: 'Route complaints to the correct environment activists administrator automatically.',
  },
  {
    icon: Clock,
    title: 'Improve Tracking',
    description: 'Enable citizens to track complaint progress and verify resolution in real time.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Provide analytical dashboards for environment activists authorities to make data-driven decisions.',
  },
  {
    icon: Database,
    title: 'Centralized Repository',
    description: 'Maintain a centralized repository of all complaints for better management and reporting.',
  },
]

export default function GoalsSection() {
  return (
    <section className="py-16 md:py-24 relative bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto">
              <img
                src="/images/clean-environment.jpg"
                alt="Clean environment goal"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Our Mission</p>
                      <p className="text-gray-500 text-xs">Cleaner communities through smart waste management</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <p className="text-emerald-600 text-sm font-semibold uppercase tracking-wider mb-3">
              Our Goals
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
              Building a{' '}
              <span className="text-emerald-600">cleaner future</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              The platform aims to improve waste management by reducing manual complaint handling, improving response times, increasing transparency, and providing environment activists authorities with real-time analytics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goals.map((goal, i) => (
                <motion.div
                  key={goal.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <goal.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{goal.title}</h4>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">{goal.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
