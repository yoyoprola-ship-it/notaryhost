import Nav from '../components/Nav'
import Hero from '../sections/Hero'
import WhatIBuild from '../sections/WhatIBuild'
import WebsiteFeature from '../sections/WebsiteFeature'
import Confirmations from '../sections/Confirmations'
import IVR from '../sections/IVR'
import Dashboard from '../sections/Dashboard'
import Tech from '../sections/Tech'
import WhoFor from '../sections/WhoFor'
import Included from '../sections/Included'
import CaseStudy from '../sections/CaseStudy'
import Pricing from '../sections/Pricing'
import Comparison from '../sections/Comparison'
import Cta from '../sections/Cta'
import Footer from '../sections/Footer'

export default function MarketingPage() {
  return (
    <div className="page">
      <Nav />
      <Hero />
      <WhatIBuild />
      <WebsiteFeature />
      <Confirmations />
      <IVR />
      <Dashboard />
      <Tech />
      <WhoFor />
      <Included />
      <CaseStudy />
      <Pricing />
      <Comparison />
      <Cta />
      <Footer />
    </div>
  )
}
