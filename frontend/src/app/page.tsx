import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProfiles } from '@/components/home/FeaturedProfiles'
import { HowItWorks } from '@/components/home/HowItWorks'
import { PlansSection } from '@/components/home/PlansSection'
import { CTASection } from '@/components/home/CTASection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProfiles />
      <HowItWorks />
      <PlansSection />
      <CTASection />
    </>
  )
}
