import Navbar from '../components/designndev/Navbar'
import SiteHero from '../components/designndev/SiteHero'
import ProblemSection from '../components/designndev/ProblemSection'
import HowItWorksSection from '../components/designndev/HowItWorksSection'
import GoalsSection from '../components/designndev/GoalsSection'
import TargetUsersSection from '../components/designndev/TargetUsersSection'
import PartnershipFormSection from '../components/designndev/PartnershipFormSection'
import Footer from '../components/designndev/Footer'
import TextureOverlay from '../components/designndev/TextureOverlay'
import { siteName, siteTagline, siteUrl } from '../lib/siteConfig'

export const metadata = {
  title: `${siteName} | Home`,
  description: siteTagline,
  keywords: 'waste complaint, environment activists, GPS geotag, waste management, report waste',
  openGraph: {
    title: `${siteName} | Home`,
    description: siteTagline,
    url: siteUrl,
    siteName,
    type: 'website',
  },
}

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <TextureOverlay />
      <Navbar />
      <div className="relative w-full mx-auto">
        <SiteHero />
        <ProblemSection />
        <HowItWorksSection />
        <GoalsSection />
        <TargetUsersSection />
        <PartnershipFormSection />
      </div>
      <Footer />
    </main>
  )
}
