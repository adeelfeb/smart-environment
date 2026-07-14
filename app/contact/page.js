import Navbar from '../../components/designndev/Navbar'
import Footer from '../../components/designndev/Footer'
import FreeConsultationSection from '../../components/designndev/FreeConsultationSection'
import TextureOverlay from '../../components/designndev/TextureOverlay'
import { siteName } from '../../lib/siteConfig'

export const metadata = {
  title: `Report Waste Issue | ${siteName}`,
  description: 'Report waste-related issues by uploading a geotagged photo. Our system routes complaints to the correct administrator.',
  keywords: 'report waste, waste complaint, environment activists, geotagged photo',
}

export default function ContactPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />
      <section className="relative min-h-[30vh] flex items-center justify-center pt-24 pb-16 bg-gradient-to-b from-emerald-50/80 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 normal-case">
            Report a <span className="text-emerald-600">Waste Issue</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-subheading">
            Upload a geotagged photo below. Our system will automatically capture your GPS location and route your complaint to the correct administrator.
          </p>
        </div>
      </section>
      <div className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <FreeConsultationSection animated={false} />
        </div>
      </div>
      <Footer />
    </main>
  )
}
