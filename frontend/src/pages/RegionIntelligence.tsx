import { useParams, useNavigate } from 'react-router-dom';
import { useWells } from '../api';
import { FieldMap } from '../components/map/FieldMap';
import { MapPin, AlertTriangle, ChevronRight, Info } from 'lucide-react';


export function RegionIntelligence() {
  const { regionId } = useParams();
  const navigate = useNavigate();
  const { data: wellsData, isLoading } = useWells();

  const decodedRegion = decodeURIComponent(regionId || "");

  if (isLoading) {
    return <div className="p-6 text-text-secondary animate-pulse">Loading region intelligence...</div>;
  }

  const regionWellsRaw = wellsData?.filter((w: any) => w.field_name === decodedRegion) || [];
  const mapWells = regionWellsRaw.map((w: any) => ({
    id: w.well_id,
    name: w.well_name,
    field_name: w.field_name || '',
    lat: w.latitude,
    lng: w.longitude,
    status: w.status,
    risk: w.status === 'ACTIVE' ? 'MEDIUM' : 'LOW',
    depth: w.current_depth || 0,
    formation: w.current_formation,
  }));
  const activeWells = regionWellsRaw.filter((w: any) => w.status === 'ACTIVE');
  const historicalWells = regionWellsRaw.filter((w: any) => w.status !== 'ACTIVE');

  let highRiskCount = 0;
  let mediumRiskCount = 0;
  
  activeWells.forEach((w: any) => {
     if (w.risk_level === 'HIGH' || w.recent_events_count > 0) highRiskCount++;
     else if (w.risk_level === 'MEDIUM') mediumRiskCount++;
  });

  let regionalRisk = "LOW";
  if (highRiskCount > 0) regionalRisk = "HIGH";
  else if (mediumRiskCount > 0) regionalRisk = "MEDIUM";

  const riskColor = regionalRisk === "HIGH" ? "text-danger bg-danger/10 border-danger/20" : 
                    regionalRisk === "MEDIUM" ? "text-warning bg-warning/10 border-warning/20" : 
                    "text-success bg-success/10 border-success/20";

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center text-xs text-text-muted mb-2 font-mono uppercase tracking-widest">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/dashboard/regions')}>Active Regions</span>
            <ChevronRight size={12} className="mx-2" />
            <span className="text-text-primary">{decodedRegion}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Region Intelligence</h2>
          <div className="flex items-center space-x-3 text-sm text-text-secondary">
            <span className="flex items-center"><MapPin size={16} className="mr-1" /> {decodedRegion}</span>
          </div>
        </div>
        <div className={`px-4 py-2 border rounded flex flex-col items-end ${riskColor}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Regional Risk</span>
          <span className="text-lg font-bold">{regionalRisk}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-[500px]">
        {/* Left Column: Intelligence Summary */}
        <div className="flex flex-col space-y-6 overflow-y-auto pr-2 pb-6">
          <div className="bg-surface border border-border rounded-lg p-5">
            <h3 className="font-semibold text-xs uppercase tracking-widest text-text-secondary border-b border-border pb-2 mb-4">Region Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-text-secondary mb-1">Active Wells</div>
                <div className="text-2xl font-light text-primary">{activeWells.length}</div>
              </div>
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-xs text-text-secondary mb-1">Historical Wells</div>
                <div className="text-2xl font-light text-text-primary">{historicalWells.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-5">
            <h3 className="font-semibold text-xs uppercase tracking-widest text-text-secondary border-b border-border pb-2 mb-4">Active Operations</h3>
            {activeWells.length === 0 ? (
              <div className="text-sm text-text-secondary italic">No active operations in this region.</div>
            ) : (
              <div className="space-y-3">
                {activeWells.map((w: any) => (
                  <div key={w.well_id} 
                    onClick={() => navigate(`/dashboard/wells/${w.well_id}`)}
                    className="p-3 bg-background border border-border rounded cursor-pointer hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold group-hover:text-primary transition-colors">{w.well_id}</span>
                      <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded border border-success/20">ACTIVE</span>
                    </div>
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>Formation: {w.current_formation || 'Unknown'}</span>
                      <span>Depth: {w.current_depth}m</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-surface border border-border rounded-lg p-5">
             <h3 className="font-semibold text-xs uppercase tracking-widest text-text-secondary border-b border-border pb-2 mb-4 flex items-center">
               <AlertTriangle size={14} className="mr-2 text-warning" /> Current Alerts
             </h3>
             <div className="space-y-3">
               {highRiskCount > 0 ? (
                 <div className="p-3 bg-danger/5 border border-danger/20 rounded text-sm text-text-secondary">
                   <strong className="text-danger-400 block mb-1">ELEVATED REGIONAL RISK</strong>
                   Multiple wells in this region are experiencing high risk events. Review individual well intelligence.
                 </div>
               ) : (
                 <div className="p-3 bg-background border border-border rounded text-sm flex items-start text-text-secondary">
                   <Info size={16} className="text-primary mt-0.5 mr-2 shrink-0" />
                   No critical regional alerts at this time. Operations proceeding within normal parameters.
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary">Regional Map</h3>
            <span className="text-xs text-text-secondary">{regionWellsRaw.length} Total Wells mapped</span>
          </div>
          <div className="flex-1 relative z-0">
             <FieldMap wells={mapWells} />
          </div>
        </div>
      </div>
    </div>
  );
}
