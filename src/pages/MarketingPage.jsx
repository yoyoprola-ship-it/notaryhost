import { useEffect } from 'react'
import Nav from '../components/Nav'
import Hero from '../sections/Hero'
import HeroBanner from '../sections/HeroBanner'
import WhatIBuild from '../sections/WhatIBuild'
import WebsiteFeature from '../sections/WebsiteFeature'
import Confirmations from '../sections/Confirmations'
import IVR from '../sections/IVR'
import MobileDispatch from '../sections/MobileDispatch'
import Dashboard from '../sections/Dashboard'
import Tech from '../sections/Tech'
import WhoFor from '../sections/WhoFor'
import Included from '../sections/Included'
import Benefits from '../sections/Benefits'
import CaseStudy from '../sections/CaseStudy'
import Directory from '../sections/Directory'
import Referrals from '../sections/Referrals'
import Pricing from '../sections/Pricing'
import Comparison from '../sections/Comparison'
import Cta from '../sections/Cta'
import Footer from '../sections/Footer'

export default function MarketingPage() {
  useEffect(() => {
    // Empty-body POSTs get rejected upstream with 411 Length Required, so
    // send a tiny real body to guarantee a Content-Length header goes out.
    fetch('/api/site-visits/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => {})
  }, [])

  return (
    <div className="page">
      <Nav />
      <Hero />
      <HeroBanner />
      <WhatIBuild />
      <WebsiteFeature />
      <Confirmations />
      <IVR />
      <MobileDispatch />
      <Dashboard />
      <Tech />
      <WhoFor />
      <Included />
      <Benefits />
      <CaseStudy />
      <Directory />
      <Referrals />
      <Pricing />
      <Comparison />
      <Cta />
      <Footer />
    </div>
  )
}
