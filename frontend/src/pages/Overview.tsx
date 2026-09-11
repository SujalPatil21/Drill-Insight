import { useDashboardOverview, useWells } from "../api";
import { FieldMap } from "../components/map/FieldMap";
import { useNavigate } from "react-router-dom";

export function Overview() {
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const { data: wellsData, isLoading: wellsLoading } = useWells();
  const navigate = useNavigate();

  const mapWells = wellsData ? wellsData.map((w: any) => ({
    id: w.well_id,
    name: w.well_name,
    field_name: w.field_name || 'UNKNOWN FIELD',
    lat: w.latitude,
    lng: w.longitude,
    status: w.status,
    risk: w.status === 'ACTIVE' ? 'MEDIUM' : 'LOW', // Simulated for overview map
    depth: w.current_depth
  })) : [];

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1 tracking-tight">Field Intelligence Overview</h2>
        <p className="text-text-secondary text-sm">Real-time drilling context, historical offset intelligence and predictive risk.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Wells', value: overviewLoading ? '...' : overview?.total_wells },
          { label: 'High Risk Wells', value: overviewLoading ? '...' : overview?.high_risk_wells, color: 'text-danger' },
          { label: 'Recent Events', value: overviewLoading ? '...' : overview?.recent_events },
          { label: 'Active Regions', value: overviewLoading ? '...' : overview?.active_wells },
          { label: 'Anomalies', value: overviewLoading ? '...' : overview?.anomalies, color: 'text-warning' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
            <div className="text-text-secondary text-xs mb-1 uppercase tracking-wider font-bold">{kpi.label}</div>
            <div className={`text-3xl font-light tracking-tight ${kpi.color || 'text-text-primary'}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary">Field Map</h3>
          </div>
          <div className="flex-1 relative z-0">
            {wellsLoading ? (
              <div className="flex items-center justify-center h-full text-text-secondary animate-pulse">Loading map data...</div>
            ) : (
              <FieldMap wells={mapWells} />
            )}
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col space-y-6 shadow-sm overflow-y-auto">
           <div>
             <h3 className="font-semibold text-xs uppercase tracking-widest text-text-secondary border-b border-border pb-2 mb-4">Critical Alerts</h3>
             <div className="space-y-3">
               <div className="p-3 bg-danger/5 border border-danger/20 rounded text-sm group cursor-pointer hover:bg-danger/10 transition-colors" onClick={() => navigate('/dashboard/wells/NWIS-ASM-001')}>
                 <div className="flex items-center space-x-2 mb-1">
                   <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                   <strong className="text-danger-400 font-bold tracking-wide">HIGH TORQUE</strong>
                 </div>
                 <span className="text-text-secondary">NWIS-ASM-001 - Elevated torque detected near current formation.</span>
               </div>
               
               <div className="p-3 bg-warning/5 border border-warning/20 rounded text-sm group cursor-pointer hover:bg-warning/10 transition-colors">
                 <div className="flex items-center space-x-2 mb-1">
                   <span className="w-2 h-2 rounded-full bg-warning"></span>
                   <strong className="text-warning-400 font-bold tracking-wide">MUD LOSS</strong>
                 </div>
                 <span className="text-text-secondary">NWIS-ASM-012 - Historical offset wells show elevated loss risk.</span>
               </div>
             </div>
           </div>
           
           <div>
             <h3 className="font-semibold text-xs uppercase tracking-widest text-text-secondary border-b border-border pb-2 mb-3">Active Regions</h3>
             <div className="space-y-1">
               {wellsData?.filter((w: any) => w.status === 'ACTIVE').slice(0, 5).map((w: any) => (
                 <div key={w.well_id} 
                      onClick={() => navigate(`/dashboard/wells/${w.well_id}`)}
                      className="flex justify-between items-center text-sm py-2 px-2 hover:bg-surface-hover rounded cursor-pointer transition-colors">
                   <span className="font-medium">{w.well_id}</span>
                   <div className="flex items-center space-x-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                     <span className="text-success text-xs font-bold">{w.status}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
