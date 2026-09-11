
import { SectionHeading } from "../ui/SectionHeading";
import { Search, Info } from "lucide-react";
import { Badge } from "../ui/Badge";

export function HistoricalSection() {
  return (
    <section className="py-32 bg-foreground text-background">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Mock Search Interface */}
          <div className="order-2 lg:order-1 flex flex-col space-y-6">
            <div className="bg-surface-light border border-border-light rounded-md p-2 shadow-sm">
              <div className="flex items-center space-x-3 px-3 py-2 bg-background-light rounded border border-border-light/50">
                <Search size={18} className="text-text-muted" />
                <span className="text-sm text-text-dark font-medium">What happened around 3,200 m in Formation X?</span>
              </div>
            </div>

            <div className="bg-surface-light border border-border-light rounded-md p-6 shadow-sm relative">
              <div className="absolute top-6 right-6">
                <Badge variant="outline" className="text-[10px] bg-background-light border-border-light text-text-muted">92% SIMILARITY</Badge>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">WELL A-12</span>
                <span className="text-text-muted text-xs">•</span>
                <span className="text-xs font-bold uppercase tracking-widest text-danger">MUD LOSS</span>
                <span className="text-text-muted text-xs">•</span>
                <span className="text-xs font-medium text-text-muted">3,180–3,240 m</span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Historical Observation</h4>
                  <p className="text-sm text-text-dark leading-relaxed">
                    Severe mud loss encountered while drilling through Formation X at 3180m. Total losses observed.
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Mitigation</h4>
                  <p className="text-sm text-text-dark leading-relaxed">
                    Pumped LCM pill. Regained partial returns after 12.5 hours of NPT.
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-4 border-t border-border-light mt-4">
                  <FileTextIcon />
                  <span className="text-xs text-text-muted font-medium">Source: DDR / WCR</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2 text-text-muted">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <p className="text-[11px] leading-tight">DEMONSTRATION EXAMPLE: AI-generated synthesis combining source evidence from historical daily drilling reports.</p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <SectionHeading 
              eyebrow="HISTORICAL INTELLIGENCE"
              title="Experience, Searchable."
              align="left"
              className="mb-8 [&_h2]:text-background"
            />
            <p className="text-text-dark/70 text-lg leading-relaxed mb-10 max-w-lg">
              Stop digging through hundreds of PDFs. Query historical drilling experience by formation, depth, or event type, and instantly retrieve relevant operational context from nearby wells.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

function FileTextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  );
}
