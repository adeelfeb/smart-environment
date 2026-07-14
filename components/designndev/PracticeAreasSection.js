'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { siteAssets } from '../../lib/siteAssets'

export default function PracticeAreasSection() {
  const areas = siteAssets.practiceAreas

  return (
    <section id="practice-areas" className="py-16 md:py-24 relative">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="section-heading font-heading text-4xl md:text-5xl font-medium text-gold-500 mb-10 md:mb-14 text-left normal-case"
        >
          <span className="text-white">Key</span> Features
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {areas.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative aspect-[4/5] min-h-[260px] sm:min-h-[300px] w-full overflow-hidden rounded-lg border border-forest-600/60 transition-all duration-300 hover:border-gold-400/90 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.5),0_0_20px_rgba(212,175,55,0.15)]"
            >
              {/* Background image */}
              <div className="absolute inset-0">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              {/* Default lighter overlay – title readable at bottom */}
              <div
                className="absolute inset-0 bg-forest-900/30 transition-colors duration-300 group-hover:bg-forest-900/75"
                aria-hidden
              />
              {/* Gradient at bottom for label readability */}
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-forest-950/80 via-forest-950/25 to-transparent transition-opacity duration-300 group-hover:from-forest-950/95 group-hover:via-forest-950/90"
                aria-hidden
              />
              {/* Content – title always visible; intro + description fade in on hover */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
                <div className="flex flex-col gap-1.5">
                  {item.intro && (
                    <p className="text-gold-200/90 text-xs md:text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {item.intro}
                    </p>
                  )}
                  <h3 className="font-subheading text-lg md:text-xl font-medium text-gold-50 drop-shadow-sm">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-gold-100/95 text-sm leading-relaxed mt-1 line-clamp-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
