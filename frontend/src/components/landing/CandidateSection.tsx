
import { SectionHeading } from "../ui/SectionHeading";
import { Badge } from "../ui/Badge";

export function CandidateSection() {
  return (
    <section className="py-32 bg-foreground text-background border-y border-border-light">
      <div className="container mx-auto px-6 max-w-7xl">
        <SectionHeading 
          title="Evaluate the Next Location."
          align="center"
          className="mb-20 [&_h2]:text-background"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 bg-surface-light border border-border-light rounded-md overflow-hidden shadow-lg max-w-5xl mx-auto">
          
          {/* Left: Map Preview */}
          <div className="relative aspect-square md:aspect-auto md:h-full bg-background border-r border-border-light overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(42,42,42,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(42,42,42,0.3)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-transparent border-2 border-primary ring-8 ring-primary/20 z-10" />
            </div>
            {/* Nearby offset wells */}
            <div className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-text-muted" />
            <div className="absolute top-[70%] left-[80%] w-2 h-2 rounded-full bg-text-muted" />
            <div className="absolute top-[60%] left-[20%] w-2 h-2 rounded-full bg-text-muted" />
          </div>

          {/* Right: Candidate Result */}
          <div className="p-10 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-text-dark mb-1">CANDIDATE C-347</h3>
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">DECISION SUPPORT DEMO</span>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">ANALYZED</Badge>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-border-light pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">OVERALL SUITABILITY</span>
                <span className="text-3xl font-light text-text-dark">89 <span className="text-sm text-text-muted">/ 100</span></span>
              </div>
              
              <div className="flex justify-between items-end border-b border-border-light pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">PROSPECTIVITY</span>
                <span className="text-3xl font-light text-text-dark">91%</span>
              </div>
              
              <div className="flex justify-between items-end border-b border-border-light pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">GEOLOGICAL SUITABILITY</span>
                <span className="text-3xl font-light text-text-dark">93 <span className="text-sm text-text-muted">/ 100</span></span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">DRILLING RISK</span>
                <span className="text-sm font-bold uppercase tracking-widest text-warning">MEDIUM</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
