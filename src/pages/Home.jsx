import React from "react";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import ValueProof from "@/components/landing/ValueProof";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <Hero />
      <ValueProof />
      <HowItWorks />
      <Features />
      <Faq />
      <Footer />
    </div>
  );
}