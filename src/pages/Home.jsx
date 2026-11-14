/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import ProofCompare from "@/components/landing/ProofCompare";
import Steps from "@/components/landing/Steps";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="lt-page relative min-h-screen bg-surface-base text-ink">
      <LandingNav />
      <Hero />
      <ProofCompare />
      <Steps />
      <Pricing />
      <Footer />
    </div>
  );
}