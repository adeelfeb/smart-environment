'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { User, Shield, Crown } from 'lucide-react'

const users = [
  {
    icon: User,
    title: 'Citizens',
    subtitle: 'Residents reporting issues',
    description: 'Report environment activists waste-related issues by uploading geotagged photos. Track complaint progress and verify resolution in real time.',
    features: ['Upload geotagged photos', 'Track complaint status', 'Verify resolution', 'Tag responsible corporation'],
    color: 'emerald',
  },
  {
    icon: Shield,
    title: 'Administrators',
    subtitle: 'Officials managing complaints',
    description: 'Review, manage, and resolve complaints within their jurisdiction. Coordinate with field teams and track resolution metrics.',
    features: ['Review incoming complaints', 'Assign to field teams', 'Update complaint status', 'View area analytics'],
    color: 'blue',
  },
  {
    icon: Crown,
    title: 'Super Admin',
    subtitle: 'Platform-level oversight',
    description: 'Unrestricted access across all corporations. System configuration, user and admin management, and organization-wide oversight.',
    features: ['Full system access', 'Manage all corporations', 'System configuration', 'Organization-wide analytics'],
    color: 'violet',
  },
]

const colorMap = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', tag: 'bg-emerald-100 text-emerald-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', tag: 'bg-blue-100 text-blue-700' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-600', tag: 'bg-violet-100 text-violet-700' },
}

export default function TargetUsersSection() {
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
            Who It&apos;s For
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
            Built for{' '}
            <span className="text-emerald-600">everyone</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            From citizens reporting issues to administrators managing resolution, our platform serves all stakeholders.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {users.map((user, i) => {
            const colors = colorMap[user.color]
            return (
              <motion.div
                key={user.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`relative bg-white rounded-2xl p-6 md:p-8 shadow-lg border ${colors.border} hover:shadow-xl transition-shadow`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center`}>
                    <user.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-gray-900">
                      {user.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{user.subtitle}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  {user.description}
                </p>
                <ul className="space-y-2">
                  {user.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.icon.split(' ')[0]}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 relative rounded-2xl overflow-hidden shadow-2xl aspect-[21/9] max-w-5xl mx-auto"
        >
          <Image
            src="/images/community.jpg"
            alt="Community using EcoWatch platform"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 80vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/70 to-transparent flex items-center">
            <div className="p-8 md:p-12 max-w-lg">
              <h3 className="font-heading text-2xl md:text-3xl font-semibold text-white mb-3">
                Empowering Communities
              </h3>
              <p className="text-white/80 text-base leading-relaxed mb-6">
                Join thousands of citizens, administrators, and authorities working together for cleaner communities.
              </p>
              <a href="/signup" className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors">
                Get Started Today
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
