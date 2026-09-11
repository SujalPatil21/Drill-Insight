
import { SectionHeading } from "../ui/SectionHeading";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "MAP",
      desc: "Locate active, historical and candidate wells."
    },
    {
      num: "02",
      title: "CONNECT",
      desc: "Connect current drilling conditions with nearby historical context."
    },
    {
      num: "03",
      title: "ANALYZE",
      desc: "Surface risk, anomalies and relevant historical evidence."
    },
    {
      num: "04",
      title: "DECIDE",
      desc: "Give engineers evidence-based decision support."
    }
  ];

  return (
    <section id="how-it-works" className="py-32 bg-background border-y border-border relative">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
          <div className="w-full md:w-1/3">
            <SectionHeading 
              title="How It Works"
              align="left"
              className="mb-8 sticky top-32"
            />
          </div>
          
          <div className="w-full md:w-2/3">
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute left-6 top-10 bottom-10 w-[1px] bg-border hidden md:block"></div>
              
              <div className="space-y-16">
                {steps.map((step, idx) => (
                  <div key={idx} className="relative flex flex-col md:flex-row md:items-start group">
                    <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-background border border-border group-hover:border-primary transition-colors duration-300 z-10 shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-border group-hover:bg-primary transition-colors duration-300"></div>
                    </div>
                    
                    <div className="md:ml-12 flex-1">
                      <span className="text-4xl font-light text-text-muted/50 mb-4 block md:hidden">
                        {step.num}
                      </span>
                      <h3 className="text-xl font-bold uppercase tracking-widest text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                        <span className="hidden md:inline text-text-muted font-light mr-4">{step.num}</span>
                        {step.title}
                      </h3>
                      <p className="text-text-secondary text-lg leading-relaxed max-w-md">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
