'use client'

import FreeConsultationSection from './FreeConsultationSection'

export default function PartnershipFormSection() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Light textured background */}
      <div className="absolute inset-0 bg-emerald-50/60" />
      <div
        className="absolute inset-0 opacity-[0.04] bg-cover bg-center pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: 'url(/images/bg.png)' }}
        aria-hidden
      />
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #059669 0.8px, transparent 0.8px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FreeConsultationSection animated />
      </div>
    </section>
  )
}
