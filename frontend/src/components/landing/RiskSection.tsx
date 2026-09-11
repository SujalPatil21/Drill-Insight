
import { SectionHeading } from "../ui/SectionHeading";

export function RiskSection() {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <SectionHeading 
              eyebrow="RISK INTELLIGENCE"
              title="See Risk Before It Becomes an Event."
              align="left"
              className="mb-8"
            />
            <p className="text-text-secondary text-lg leading-relaxed mb-10 max-w-lg">
              NWIS utilizes historical data to surface model-derived drilling risk indicators in real-time. 
              By combining nearby historical events with your current trajectory and parameters, it provides 
              continuous probabilistic risk assessment.
            </p>
          </div>

          {/* Mock Risk Interface */}
          <div className="bg-surface border border-border rounded-md p-8 shadow-2xl relative">
            <div className="mb-8 pb-6 border-b border-border">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block mb-2">CURRENT DRILLING RISK</span>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-warning ring-4 ring-warning/20"></div>
                <span className="text-2xl font-bold tracking-tight text-warning uppercase">MEDIUM</span>
              </div>
            </div>

            <div className="space-y-6">
              <RiskRow label="MUD LOSS" value="62%" level="HIGH" color="bg-danger" />
              <RiskRow label="HIGH TORQUE" value="41%" level="MEDIUM" color="bg-warning" />
              <RiskRow label="STUCK PIPE" value="18%" level="LOW" color="bg-success" />
              <RiskRow label="KICK" value="07%" level="LOW" color="bg-success" />
            </div>

            <div className="mt-8 pt-4 border-t border-border/50 text-center">
              <span className="text-[10px] text-text-muted uppercase tracking-widest">DEMONSTRATION VALUES ONLY</span>
            </div>
          </div>

        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
    </section>
  );
}

function RiskRow({ label, value, level, color }: { label: string, value: string, level: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-text-primary tracking-wide">{label}</span>
      <div className="flex items-center space-x-6">
        <span className="text-lg font-mono text-text-secondary w-12 text-right">{value}</span>
        <div className="w-20 text-right">
          <span className={`text-xs font-bold uppercase tracking-widest ${color.replace('bg-', 'text-')}`}>
            {level}
          </span>
        </div>
      </div>
    </div>
  );
}
