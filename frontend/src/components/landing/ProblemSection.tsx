
import { SectionHeading } from "../ui/SectionHeading";

export function ProblemSection() {
  const problems = [
    {
      num: "01",
      title: "SCATTERED KNOWLEDGE",
      desc: "Historical experience spread across WCRs, DDRs, mud logs and other drilling records."
    },
    {
      num: "02",
      title: "LIMITED OFFSET CONTEXT",
      desc: "Nearby wells may contain critical depth- and formation-specific experience."
    },
    {
      num: "03",
      title: "REACTIVE DECISIONS",
      desc: "Current drilling data alone may not reveal what happened previously at similar intervals."
    },
    {
      num: "04",
      title: "DISCONNECTED DATA",
      desc: "Operational, spatial and historical information often exists separately."
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 max-w-7xl">
        <SectionHeading 
          title="Context Shouldn't Be Buried in Reports."
          description="Critical drilling experience often exists across historical well reports, drilling records and individual knowledge."
          className="mb-20"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {problems.map((prob, idx) => (
            <div key={idx} className="flex flex-col border-t border-border pt-6">
              <span className="text-primary font-mono text-sm mb-4">{prob.num}</span>
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-3">
                {prob.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {prob.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
