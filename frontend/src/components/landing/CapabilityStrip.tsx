

export function CapabilityStrip() {
  const capabilities = [
    {
      title: "NEARBY WELL INTELLIGENCE",
      desc: "Historical offset context"
    },
    {
      title: "DRILLING RISK",
      desc: "Model-derived decision support"
    },
    {
      title: "HISTORICAL KNOWLEDGE",
      desc: "WCR / DDR / drilling reports"
    },
    {
      title: "CANDIDATE EVALUATION",
      desc: "Evidence-based location assessment"
    }
  ];

  return (
    <section className="bg-foreground text-background py-8 border-y border-border-light relative z-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 divide-y md:divide-y-0 md:divide-x divide-border-light/30">
          {capabilities.map((cap, idx) => (
            <div key={idx} className="flex flex-col px-4 first:pl-0 last:pr-0 py-4 lg:py-0">
              <span className="text-[11px] font-bold uppercase tracking-widest text-background mb-2">
                {cap.title}
              </span>
              <span className="text-sm text-text-dark/70">
                {cap.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
