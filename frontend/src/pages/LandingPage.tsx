import { useEffect } from "react";
import { LandingNavbar } from "../components/navigation/LandingNavbar";
import { LandingFooter } from "../components/navigation/LandingFooter";
import { HeroSection } from "../components/landing/HeroSection";
import { CapabilityStrip } from "../components/landing/CapabilityStrip";
import { ProblemSection } from "../components/landing/ProblemSection";
import { SolutionSection } from "../components/landing/SolutionSection";
import { CoreCapabilities } from "../components/landing/CoreCapabilities";
import { GeospatialSection } from "../components/landing/GeospatialSection";
import { HistoricalSection } from "../components/landing/HistoricalSection";
import { RiskSection } from "../components/landing/RiskSection";
import { CandidateSection } from "../components/landing/CandidateSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { DataEcosystemSection } from "../components/landing/DataEcosystemSection";
import { FinalCtaSection } from "../components/landing/FinalCtaSection";

export function LandingPage() {
  // Ensure page always starts at top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/30">
      <LandingNavbar />
      
      <main>
        <HeroSection />
        <CapabilityStrip />
        <ProblemSection />
        <SolutionSection />
        <CoreCapabilities />
        <GeospatialSection />
        <HistoricalSection />
        <RiskSection />
        <CandidateSection />
        <HowItWorksSection />
        <DataEcosystemSection />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
