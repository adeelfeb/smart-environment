'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '../../components/designndev/Navbar'
import Footer from '../../components/designndev/Footer'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    question: 'What is EcoWatch?',
    answer:
      'EcoWatch is a Smart Environment Activists Waste Complaint & Monitoring System. It enables citizens to report waste-related issues by uploading geotagged photos, which are automatically routed to the correct administrator for review and resolution.',
  },
  {
    question: 'How do I report a waste issue?',
    answer:
      'Sign up for an account, then use the report form to upload a photo of the waste issue. The system automatically captures your GPS location and routes the complaint to the responsible corporation and ward administrator.',
  },
  {
    question: 'How does the GPS location capture work?',
    answer:
      'When you upload a photo, the system extracts GPS coordinates from the image metadata (EXIF data). This allows precise identification of where the waste issue is located without requiring manual address entry.',
  },
  {
    question: 'Can I track my complaint after submitting it?',
    answer:
      'Yes. After submitting a complaint, you can track its progress through your dashboard. The system provides real-time status updates from submission through review and resolution.',
  },
  {
    question: 'How are complaints routed to administrators?',
    answer:
      'The system identifies the responsible Environment Activists Corporation based on the GPS location and tags you provide. Complaints are automatically routed to the appropriate administrator for that area.',
  },
  {
    question: 'What is the analytics dashboard?',
    answer:
      'The analytics dashboard provides environment activists authorities with real-time insights into complaint patterns, resolution times, and environmental hotspots. It helps authorities make data-driven decisions for better waste management.',
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />
      {/* Hero */}
      <section className="relative min-h-[35vh] flex items-center justify-center pt-24 pb-16 bg-gradient-to-b from-emerald-50/80 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 normal-case">
            Frequently Asked <span className="text-emerald-600">Questions</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-subheading">
            Everything you need to know about reporting waste issues, tracking complaints, and using the EcoWatch platform.
          </p>
        </div>
      </section>
      {/* FAQ list */}
      <div className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="divide-y divide-gray-100">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index
              return (
                <div key={index} className="py-6 first:pt-0">
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    className="w-full flex items-center justify-between gap-4 text-left no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-xl"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="font-subheading text-lg md:text-xl font-medium text-gray-900 pr-4">
                      {item.question}
                    </span>
                    <span className="shrink-0 w-9 h-9 flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-100 transition-colors rounded-full">
                      {isOpen ? (
                        <Minus className="w-4 h-4" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden />
                      )}
                    </span>
                  </button>
                  <div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="pt-3 pb-1 text-gray-600 leading-relaxed font-subheading text-base md:text-lg">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          {/* CTA */}
          <div className="mt-16 pt-10 border-t border-gray-100 text-center">
            <p className="text-gray-600 font-subheading text-lg mb-4">
              Still have questions?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="btn-fc-primary">
                Sign Up to Get Started
              </Link>
              <Link href="/contact" className="btn-fc-secondary">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
