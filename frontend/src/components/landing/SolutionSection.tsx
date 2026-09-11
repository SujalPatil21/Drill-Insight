
import { SectionHeading } from "../ui/SectionHeading";
import { Database, FileText, Map as MapIcon, Activity } from "lucide-react";

export function SolutionSection() {
  return (
    <section className="py-32 bg-foreground text-background overflow-hidden relative">
      <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
        <SectionHeading 
          title="One Intelligence Layer."
          align="center"
          className="mb-24 [&_h2]:text-background"
        />

        <div className="flex flex-col items-center max-w-4xl mx-auto">
          {/* Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full mb-12">
            {[
              { label: "CURRENT WELL", icon: <Activity size={24} strokeWidth={1.5} /> },
              { label: "NEARBY WELLS", icon: <MapIcon size={24} strokeWidth={1.5} /> },
              { label: "HISTORICAL REPORTS", icon: <FileText size={24} strokeWidth={1.5} /> },
              { label: "DRILLING CONTEXT", icon: <Database size={24} strokeWidth={1.5} /> }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-6 border border-border-light rounded-md bg-surface-light">
                <div className="text-primary mb-3">{item.icon}</div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-dark text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Connectors */}
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="w-[1px] h-12 bg-primary"></div>
            <div className="w-3 h-3 rounded-full bg-primary my-2 ring-4 ring-primary/20"></div>
            <div className="text-2xl font-bold tracking-widest my-4 text-background">NWIS</div>
            <div className="w-[1px] h-12 bg-primary"></div>
          </div>

          {/* Output */}
          <div className="w-full max-w-md bg-surface-light border border-border-light rounded-md p-8 shadow-sm">
            <h3 className="text-lg font-bold uppercase tracking-widest text-primary text-center">
              ACTIONABLE WELL INTELLIGENCE
            </h3>
          </div>
        </div>
      </div>
      
      {/* Subtle background pattern for off-white section */}
      <div className="absolute inset-0 bg-[radial-gradient(#D6D6D1_1px,transparent_1px)] [background-size:32px_32px] opacity-30" />
    </section>
  );
}
