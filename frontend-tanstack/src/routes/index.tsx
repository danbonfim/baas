import { createFileRoute } from '@tanstack/react-router'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProfiles } from '@/components/home/FeaturedProfiles'
import { HowItWorks } from '@/components/home/HowItWorks'
import { PlansSection } from '@/components/home/PlansSection'
import { CTASection } from '@/components/home/CTASection'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
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
