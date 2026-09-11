import { Server, Database, CheckCircle, Zap } from "lucide-react";

export function ModelStatus() {
  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Model & Services Status</h2>
        <p className="text-text-secondary">Connection and health status of the backend infrastructure and intelligence models.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        {[
          { name: "PostgreSQL Data Layer", icon: <Database size={24}/>, status: "ACTIVE", desc: "Core relational data, models, and PostGIS geometries." },
          { name: "Recommendation Engine", icon: <Zap size={24}/>, status: "ACTIVE", desc: "Deterministic decision-support rules engine." },
          { name: "Historical Indexer", icon: <Server size={24}/>, status: "ACTIVE", desc: "Offset well historical search and indexing." },
          { name: "Predictive ML Model", icon: <Server size={24}/>, status: "PLUGGABLE", desc: "External anomaly detection and predictive scoring." },
          { name: "Vector Search", icon: <Database size={24}/>, status: "OPTIONAL", desc: "pgvector semantic search extensions." }
        ].map((service, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${service.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-surface-hover text-text-muted'}`}>
                  {service.icon}
                </div>
                <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${service.status === 'ACTIVE' ? 'bg-success/5 border-success/20 text-success' : 'bg-surface-hover border-border text-text-secondary'}`}>
                  {service.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>}
                  <span className="text-[10px] font-bold tracking-widest">{service.status}</span>
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-2">{service.name}</h3>
              <p className="text-sm text-text-secondary">{service.desc}</p>
            </div>
            {service.status === 'ACTIVE' && (
              <div className="mt-6 pt-4 border-t border-border flex items-center text-xs text-text-muted">
                <CheckCircle size={14} className="mr-1.5 text-success"/> Connected and operating normally
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
