import Link from 'next/link'
import Image from 'next/image'
import Navbar from '../../components/designndev/Navbar'
import Footer from '../../components/designndev/Footer'
import TextureOverlay from '../../components/designndev/TextureOverlay'
import { siteAssets } from '../../lib/siteAssets'
import { siteName, siteTagline } from '../../lib/siteConfig'

const sections = [
  {
    id: '01',
    title: 'Our story',
    image: siteAssets.aboutStory,
    body: `Environment activists corporations often rely on phone calls, emails, or manual reporting methods to receive waste-related complaints. These approaches suffer from incomplete location details, delayed responses, duplicate complaints, and lack of visibility into complaint resolution.

EcoWatch was built to solve these problems by digitizing the complaint lifecycle with image-based reporting and automatic location capture.`,
  },
  {
    id: '02',
    title: 'What we focus on',
    image: siteAssets.aboutProblem,
    body: `Our platform focuses on three core areas: simplifying waste complaint reporting for citizens, routing complaints to the correct environment activists administrator, and providing real-time analytics for better decision-making.

We believe technology can transform how communities manage waste, making our cities cleaner and more livable.`,
  },
  {
    id: '03',
    title: 'How we work',
    image: siteAssets.aboutSpark,
    body: `Citizens report waste-related issues by uploading a geotagged photo. The system captures GPS location, the citizen tags the responsible corporation and ward, and the complaint is routed to the correct admin for review and resolution.

Every complaint is tracked from submission to resolution, ensuring full transparency and accountability.`,
  },
  {
    id: '04',
    title: 'Impact',
    image: siteAssets.aboutGrowth,
    body: `By reducing manual complaint handling, improving response times, and increasing transparency, we help environment activists authorities serve their communities better.

Our analytics dashboard provides real-time insights into complaint patterns, resolution times, and environmental hotspots.`,
  },
  {
    id: '05',
    title: 'Mission',
    image: siteAssets.aboutMission,
    body: `Our mission is to improve waste management by reducing complaint resolution time, providing analytical dashboards for environment activists authorities, and maintaining a centralized repository of complaints.

We envision cleaner communities powered by smart, data-driven waste management systems.`,
  },
]

export const metadata = {
  title: `About Us | ${siteName}`,
  description: 'Learn about EcoWatch — the Smart Environment Activists Waste Complaint & Monitoring System.',
  keywords: 'about us, environment activists, waste management, complaint system',
}

export default function AboutUsPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <TextureOverlay opacity={0.03} className="mix-blend-overlay" />
      <Navbar />
      {/* Hero */}
      <section className="relative min-h-[35vh] flex items-center justify-center pt-24 pb-16 bg-gradient-to-b from-emerald-50/80 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 normal-case">
            About <span className="text-emerald-600">Us</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-8 leading-relaxed font-subheading">
            {siteTagline}
          </p>
          <Link href="/signup" className="btn-fc-primary">
            Report an Issue
          </Link>
        </div>
      </section>
      {/* Content sections */}
      <div className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {sections.map((section, index) => (
            <section key={section.id} className="pt-16 first:pt-0">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-16 items-center">
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <span className="text-emerald-500 font-subheading text-sm font-semibold tracking-wider uppercase">{section.id}</span>
                  <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mt-2 mb-5 normal-case">
                    {section.title}
                  </h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line font-subheading text-base md:text-lg">
                    {section.body}
                  </div>
                </div>
                {section.image && (
                  <div
                    className={`relative aspect-[16/11] overflow-hidden bg-emerald-50 rounded-xl ${
                      index % 2 === 1 ? 'md:order-1' : ''
                    }`}
                  >
                    <Image
                      src={section.image}
                      alt={section.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
              </div>
            </section>
          ))}
          {/* CTA */}
          <section className="mt-20 pt-12 border-t border-gray-100">
            <div className="bg-emerald-50 rounded-2xl p-8 md:p-12">
              <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-4 normal-case">
                Get Started
              </h2>
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-6 font-subheading max-w-2xl">
                Ready to help keep our communities clean? Create an account to start reporting waste issues and tracking complaint resolution.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8 font-subheading max-w-2xl">
                Our platform digitizes the complaint lifecycle by enabling image-based reporting with automatic location capture and centralized complaint management.
              </p>
              <Link href="/signup" className="btn-fc-primary">
                Create an Account
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
