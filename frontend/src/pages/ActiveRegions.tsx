import { useWells } from "../api";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function ActiveRegions() {
  const { data: wellsData, isLoading } = useWells();
  const navigate = useNavigate();

  const activeWells = wellsData?.filter((w: any) => w.status === 'ACTIVE') || [];

  // Group by region/field_name
  const regions: Record<string, any> = {};
  
  activeWells.forEach((w: any) => {
    const key = w.field_name || w.region || "Unknown Region";
    if (!regions[key]) {
      regions[key] = {
        name: key,
        geographicRegion: w.region || "India",
        wells: [],
        riskScore: 0,
      };
    }
    regions[key].wells.push(w);
  });

  const regionCards = Object.values(regions).map(r => {
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    
    r.wells.forEach((w: any) => {
       if (w.risk_level === 'HIGH' || w.recent_events_count > 0) highRiskCount++;
       else if (w.risk_level === 'MEDIUM') mediumRiskCount++;
    });

    let regionalRisk = "LOW";
    if (highRiskCount > 0) regionalRisk = "HIGH";
    else if (mediumRiskCount > 0) regionalRisk = "MEDIUM";

    return {
      ...r,
      regionalRisk
    };
  });

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Active Regions</h2>
        <p className="text-text-secondary">Current field operations and regional risk intelligence.</p>
      </div>

      {isLoading ? (
        <div className="flex space-x-4">
          {[1,2,3].map(i => (
             <div key={i} className="w-full md:w-1/3 h-64 bg-surface border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regionCards.map((region: any) => {
            const risk = region.regionalRisk;
            const riskColor = risk === "HIGH" ? "text-danger bg-danger/10 border-danger/20" : 
                             risk === "MEDIUM" ? "text-warning bg-warning/10 border-warning/20" : 
                             "text-success bg-success/10 border-success/20";
            
            return (
              <div 
                key={region.name} 
                onClick={() => navigate(`/dashboard/regions/${encodeURIComponent(region.name)}`)}
                className="bg-surface border border-border rounded-lg p-6 shadow-sm hover:border-primary/50 hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{region.name}</h3>
                    <p className="text-sm text-text-secondary">{region.geographicRegion}</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                    <span className="text-[10px] font-bold text-success tracking-widest">ACTIVE</span>
                  </div>
                </div>
                
                <div className="mb-4">
                   <div className="text-sm font-semibold mb-2">{region.wells.length} Active Wells</div>
                   <div className="space-y-1">
                     {region.wells.slice(0, 3).map((w: any) => (
                       <div key={w.well_id} className="text-xs text-text-secondary font-mono bg-background border border-border px-2 py-1 rounded">
                         {w.well_id}
                       </div>
                     ))}
                     {region.wells.length > 3 && (
                       <div className="text-xs text-text-muted italic px-1">+{region.wells.length - 3} more...</div>
                     )}
                   </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary">Regional Risk</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskColor}`}>
                      {risk}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary">Nearby Wells</span>
                    <span className="text-xs font-semibold">{wellsData?.filter((w: any) => w.field_name === region.name).length || 0}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-primary text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  VIEW REGION <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
