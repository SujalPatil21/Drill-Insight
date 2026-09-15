import { useParams, useNavigate } from "react-router-dom";
import { useWellIntelligence, useWellObservations, useWellRecommendation, useWellEvents, downloadWellReport } from "../api";
import { Activity, AlertTriangle, FileText, Download, ShieldAlert, Cpu, ArrowLeft, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


function RiskBadge({ level }: { level?: string }) {
  if (!level) return null;
  const cfg: Record<string, string> = {
    HIGH: 'text-danger border-danger/30 bg-danger/10',
    CRITICAL: 'text-danger border-danger/30 bg-danger/10',
    MEDIUM: 'text-warning border-warning/30 bg-warning/10',
    LOW: 'text-success border-success/30 bg-success/10',
  };
  return <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${cfg[level?.toUpperCase()] ?? cfg.LOW}`}>{level}</span>;
}

function InfoRow({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span className="text-text-secondary text-xs">{label}</span>
      <span className={`text-xs font-medium ${accent ? 'text-primary' : 'text-text-primary'}`}>{value ?? '—'}</span>
    </div>
  );
}

export function WellIntelligence() {
  const { wellId } = useParams<{ wellId: string }>();
  const navigate = useNavigate();

  const { data: intData, isLoading: intLoading, isError: intError, refetch: refetchInt } = useWellIntelligence(wellId || '');
  const { data: obsData } = useWellObservations(wellId || '');
  const { data: recData, isLoading: recLoading } = useWellRecommendation(wellId || '');
  const { data: eventsData } = useWellEvents(wellId || '');


  // Loading
  if (intLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-surface rounded" />
        <div className="h-4 w-48 bg-surface rounded" />
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-surface rounded-lg border border-border" />)}
        </div>
      </div>
    );
  }

  // Error
  if (intError || !intData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 text-center space-y-4">
        <AlertTriangle className="text-danger" size={36} />
        <p className="text-text-secondary text-sm">Unable to load intelligence for <strong>{wellId}</strong>.</p>
        <div className="flex gap-3">
          <button onClick={() => refetchInt()} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <RefreshCw size={12} /> Retry
          </button>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-secondary hover:underline">
            <ArrowLeft size={12} /> Back
          </button>
        </div>
      </div>
    );
  }

  const well = intData?.well;
  const risk = intData?.risk_intelligence;
  const anomalies = intData?.anomalies || [];

  // Chart data from observations
  const chartData = obsData ? [...obsData].reverse().map((o: any) => ({
    depth: Math.round(o.measured_depth || 0),
    rop:    Number((o.parameters?.rop || 0).toFixed(1)),
    torque: Number((o.parameters?.torque || 0).toFixed(1)),
    wob:    Number((o.parameters?.wob || 0).toFixed(1)),
  })) : [];

  const severityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const sortedEvents = eventsData ? [...eventsData].sort((a: any, b: any) =>
    (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
  ) : [];

  const _riskColor = (r?: string) => r === 'HIGH' || r === 'CRITICAL' ? '#D94A4A' : r === 'MEDIUM' ? '#C78A2C' : '#3E8F68';
  void _riskColor;


  return (
    <div className="p-6 animate-in fade-in duration-300">

      {/* Back + Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted text-xs hover:text-primary mb-2 transition-colors">
            <ArrowLeft size={12} /> Back
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold tracking-tight">{well?.well_id || wellId}</h2>
            <RiskBadge level={well?.status} />
          </div>
          <p className="text-text-secondary text-sm">{well?.well_name} • {well?.field_name}</p>
        </div>
        <button onClick={() => wellId && downloadWellReport(wellId)}
          className="flex items-center gap-2 bg-surface border border-border text-text-secondary px-3 py-1.5 rounded hover:border-primary/50 hover:text-text-primary transition-colors text-xs font-bold uppercase tracking-widest">
          <Download size={14} /> Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="space-y-5">

          {/* Well Overview */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-3">Well Overview</h3>
            <InfoRow label="Well ID" value={well?.well_id} accent />
            <InfoRow label="Well Type" value={well?.well_type} />
            <InfoRow label="Current Depth" value={well?.current_depth ? `${Math.round(well.current_depth).toLocaleString()} m` : '—'} />
            <InfoRow label="Total Depth" value={well?.total_depth ? `${Math.round(well.total_depth).toLocaleString()} m` : '—'} />
            <InfoRow label="Formation" value={well?.current_formation} accent />
            <InfoRow label="Status" value={well?.status} />
            <InfoRow label="Field" value={well?.field_name} />
          </div>

          {/* Risk Intelligence */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-3 flex items-center gap-1.5"><ShieldAlert size={11}/> Risk Intelligence</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Overall Risk', value: risk?.overall_risk },
                { label: 'Mud Loss Risk', value: risk?.mud_loss_risk },
                { label: 'Stuck Pipe Risk', value: risk?.stuck_pipe_risk },
                { label: 'High Torque Risk', value: risk?.high_torque_risk },
                { label: 'Kick Risk', value: risk?.kick_risk },
              ].map((r, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-text-secondary text-xs">{r.label}</span>
                  <RiskBadge level={r.value} />
                </div>
              ))}
            </div>
          </div>

          {/* Active Anomalies */}
          {anomalies.length > 0 && (
            <div className="bg-danger/5 border border-danger/20 rounded-lg p-5 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-danger border-b border-danger/20 pb-2 mb-3 flex items-center gap-1.5"><AlertTriangle size={11}/> Anomalies ({anomalies.length})</h3>
              <div className="space-y-3">
                {anomalies.map((a: any) => (
                  <div key={a.id} className="text-xs">
                    <span className="font-bold text-danger">{a.parameter?.toUpperCase()}</span>
                    <p className="text-text-secondary mt-0.5">Observed {a.observed_value} vs Expected {a.expected_value} at {a.measured_depth}m</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Columns */}
        <div className="lg:col-span-2 space-y-5">

          {/* Real-time parameters chart */}
          {chartData.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-4 flex items-center gap-1.5"><Activity size={11}/> Drilling Parameters</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                    <XAxis dataKey="depth" stroke="#555" tick={{ fontSize: 10 }} label={{ value: 'Depth (m)', position: 'insideBottom', fill: '#737373', fontSize: 10 }} />
                    <YAxis yAxisId="l" stroke="#555" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="r" orientation="right" stroke="#087F73" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#171717', border: '1px solid #2A2A2A', borderRadius: '6px', fontSize: '11px' }} />
                    <Line yAxisId="l" type="monotone" dataKey="rop" stroke="#A3A3A3" name="ROP (m/hr)" strokeWidth={1.5} dot={false} />
                    <Line yAxisId="r" type="monotone" dataKey="torque" stroke="#087F73" name="Torque" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Historical Events */}
          {sortedEvents.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-3 flex items-center gap-1.5"><AlertTriangle size={11}/> Historical Events ({sortedEvents.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sortedEvents.map((e: any, i: number) => (
                  <div key={i} className="text-xs p-3 rounded border border-border bg-background">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-text-primary">{e.event_type?.replace(/_/g,' ')}</span>
                      <RiskBadge level={e.severity} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 text-text-secondary mb-1">
                      <span>Depth: {e.event_depth ? `${Math.round(e.event_depth)}m` : '—'}</span>
                      <span>Formation: {e.formation || '—'}</span>
                    </div>
                    {e.description && <p className="text-text-secondary">{e.description}</p>}
                    {e.mitigation && <p className="text-success mt-0.5">↳ {e.mitigation}</p>}
                    {e.npt_hours && <span className="text-warning">NPT: {e.npt_hours}h</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation Engine */}
          <div className="bg-surface border border-border border-t-2 border-t-primary rounded-lg p-5 shadow-md">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b border-border pb-2 mb-4 flex items-center gap-1.5"><Cpu size={11}/> Recommendation Engine — Decision Support</h3>
            {recLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-border rounded w-32" />
                <div className="h-3 bg-border rounded w-full" />
              </div>
            ) : recData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${recData.confidence === 'HIGH' ? 'text-success border-success/30 bg-success/10' : 'text-warning border-warning/30 bg-warning/10'}`}>
                    CONFIDENCE: {recData.confidence}
                  </span>
                  <span className="text-text-primary font-bold text-sm">{recData.primary_risk}</span>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed">{recData.why}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Recommended Actions</h4>
                    <ul className="space-y-1.5">
                      {recData.recommended_actions?.map((a: string, i: number) => (
                        <li key={i} className="text-xs text-text-primary flex gap-2"><span className="text-primary shrink-0">•</span>{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-background rounded border border-border p-3">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Supporting Evidence</h4>
                    <ul className="space-y-1.5">
                      {recData.supporting_evidence?.map((e: string, i: number) => (
                        <li key={i} className="text-xs text-text-secondary flex gap-2"><FileText size={10} className="text-text-muted shrink-0 mt-0.5"/>{e}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary text-xs">No recommendation data available.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
