
import { SectionHeading } from "../ui/SectionHeading";
import { Map, AlertTriangle, FileSearch, Target } from "lucide-react";

export function CoreCapabilities() {
  const capabilities = [
    {
      id: "01",
      title: "FIELD INTELLIGENCE",
      desc: "Explore wells spatially and understand the context around an active or proposed location.",
      icon: <Map className="text-primary w-8 h-8" strokeWidth={1.5} />
    },
    {
      id: "02",
      title: "RISK INTELLIGENCE",
      desc: "Surface model-derived drilling risk indicators for events such as mud loss, stuck pipe, kick and high torque.",
      icon: <AlertTriangle className="text-primary w-8 h-8" strokeWidth={1.5} />
    },
    {
      id: "03",
      title: "HISTORICAL INTELLIGENCE",
      desc: "Search historical drilling experience by well, formation, depth and event.",
      icon: <FileSearch className="text-primary w-8 h-8" strokeWidth={1.5} />
    },
    {
      id: "04",
      title: "CANDIDATE EVALUATION",
      desc: "Evaluate proposed well locations using nearby-well and available geological/reservoir evidence.",
      icon: <Target className="text-primary w-8 h-8" strokeWidth={1.5} />
    }
  ];

  return (
    <section id="capabilities" className="py-32 bg-background border-t border-border relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <SectionHeading 
          title="Built Around the Drilling Decision."
          align="left"
          className="mb-24"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
          {capabilities.map((cap, idx) => (
            <div key={idx} className="flex flex-col relative group">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
                {cap.icon}
                <span className="text-4xl font-light text-border group-hover:text-primary transition-colors duration-500">
                  {cap.id}
                </span>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground mb-4">
                {cap.title}
              </h3>
              <p className="text-text-secondary leading-relaxed max-w-md">
                {cap.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
