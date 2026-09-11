
import { SectionHeading } from "../ui/SectionHeading";

export function DataEcosystemSection() {
  const sources = [
    "eRTMAC",
    "Drilling Data",
    "WCR",
    "DDR",
    "Mud Logs",
    "Well History",
    "Geological Data",
    "Reservoir Data"
  ];

  return (
    <section className="py-32 bg-surface overflow-hidden border-b border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-24">
          <SectionHeading 
            eyebrow="INTEGRATION"
            title="Designed to integrate with"
            align="center"
          />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-16">
            {sources.map((source, idx) => (
              <div key={idx} className="bg-background border border-border rounded p-4 text-center">
                <span className="text-[10px] font-medium uppercase tracking-widest text-text-secondary">
                  {source}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mb-16 relative">
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent -z-10"></div>
             <div className="w-[1px] h-16 bg-gradient-to-b from-primary/50 to-primary absolute -top-16 left-1/2 -z-10"></div>
             
             <div className="bg-background border border-primary px-8 py-4 rounded shadow-[0_0_30px_rgba(8,127,115,0.1)]">
                <span className="text-lg font-bold tracking-widest text-foreground">NWIS</span>
             </div>
             
             <div className="w-[1px] h-16 bg-gradient-to-b from-primary to-transparent absolute -bottom-16 left-1/2 -z-10"></div>
          </div>
          
          <div className="flex justify-center">
            <div className="bg-background border border-border px-8 py-3 rounded">
               <span className="text-xs font-bold uppercase tracking-widest text-primary">Drilling Intelligence</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
