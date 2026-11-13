import React from "react";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import ProofCompare from "@/components/landing/ProofCompare";
import Steps from "@/components/landing/Steps";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <Hero />
      <ProofCompare />
      <Steps />
      <Pricing />
      <Footer />
    </div>
  );
}