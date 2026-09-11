import { useRiskOverview } from "../api";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Activity, Shield, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

function RiskBadge({ level }: { level: string }) {
  const cfg: Record<string, { bg: string; text: string }> = {
    HIGH:     { bg: 'rgba(217,74,74,0.12)',  text: '#D94A4A' },
    CRITICAL: { bg: 'rgba(217,74,74,0.12)',  text: '#D94A4A' },
    MEDIUM:   { bg: 'rgba(199,138,44,0.12)', text: '#C78A2C' },
    LOW:      { bg: 'rgba(62,143,104,0.12)', text: '#3E8F68' },
  };
  const { bg, text } = cfg[level?.toUpperCase()] ?? cfg.LOW;
  return (
    <span style={{ background: bg, color: text, border: `1px solid ${text}33`, borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {level}
    </span>
  );
}

export function RiskIntelligence() {
  const { data, isLoading, isError, refetch } = useRiskOverview();
  const navigate = useNavigate();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 flex flex-col space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-surface rounded" />
        <div className="h-4 w-96 bg-surface rounded" />
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-surface rounded-lg border border-border" />)}
        </div>
        <div className="h-72 bg-surface rounded-lg border border-border" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full space-y-4 text-center">
        <AlertTriangle className="text-danger" size={40} />
        <p className="text-text-secondary">Unable to load Risk Intelligence data.</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm px-4 py-2 rounded transition-colors"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const { summary, risk_summary, high_risk_wells, medium_risk_wells, risk_categories } = data;


  const chartData = [
    { name: 'High Risk',   value: risk_summary?.high   ?? 0, color: '#D94A4A' },
    { name: 'Medium Risk', value: risk_summary?.medium ?? 0, color: '#C78A2C' },
    { name: 'Low Risk',    value: risk_summary?.low    ?? 0, color: '#3E8F68' },
  ];

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold tracking-tight">Risk Intelligence Dashboard</h2>
          <span className="text-[10px] bg-warning/10 text-warning border border-warning/20 rounded px-2 py-0.5 font-bold tracking-widest uppercase">Demo Intelligence</span>
        </div>
        <p className="text-text-secondary text-sm">
          Field-wide aggregation of predicted operational risks based on historical analogy and drilling context.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Wells',   value: summary?.total_wells,       color: '' },
          { label: 'High Risk',     value: summary?.high_risk,         color: 'text-danger' },
          { label: 'Medium Risk',   value: summary?.medium_risk,       color: 'text-warning' },
          { label: 'Anomalies',     value: summary?.anomalies_detected, color: 'text-warning' },
        ].map((k, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4 shadow-sm">
            <div className="text-text-secondary text-xs uppercase tracking-widest font-bold mb-1">{k.label}</div>
            <div className={`text-3xl font-light tracking-tight ${k.color || 'text-text-primary'}`}>{k.value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Chart + High Risk + Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Donut Chart */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-4">Risk Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="value">
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ background: '#171717', border: '1px solid #2A2A2A', borderRadius: '6px', fontSize: '12px' }}
                  labelStyle={{ color: '#F5F5F2' }}
                />
                <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-danger border-b border-border pb-2 mb-4 flex items-center gap-2">
            <AlertTriangle size={12} /> High Risk Operations
          </h3>
          {!high_risk_wells?.length
            ? <p className="text-text-secondary text-sm">No high risk operations detected.</p>
            : (
              <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {high_risk_wells.map((w: any) => (
                  <li key={w.well_id}
                    onClick={() => navigate(`/dashboard/wells/${w.well_id}`)}
                    className="flex justify-between items-center text-sm p-3 bg-danger/5 border border-danger/10 rounded cursor-pointer hover:bg-danger/10 transition-colors"
                  >
                    <div>
                      <strong className="block text-foreground text-xs font-bold">{w.well_id}</strong>
                      <span className="text-text-secondary text-xs">{w.field_name ?? w.well_name}</span>
                    </div>
                    <RiskBadge level="HIGH" />
                  </li>
                ))}
              </ul>
            )
          }
        </div>

        {/* Medium Risk Watchlist */}
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-warning border-b border-border pb-2 mb-4 flex items-center gap-2">
            <Activity size={12} /> Watchlist — Medium Risk
          </h3>
          {!medium_risk_wells?.length
            ? <p className="text-text-secondary text-sm">No watchlist operations detected.</p>
            : (
              <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {medium_risk_wells.map((w: any) => (
                  <li key={w.well_id}
                    onClick={() => navigate(`/dashboard/wells/${w.well_id}`)}
                    className="flex justify-between items-center text-sm p-3 bg-surface border border-border rounded cursor-pointer hover:bg-surface-hover transition-colors"
                  >
                    <div>
                      <strong className="block text-foreground text-xs font-bold">{w.well_id}</strong>
                      <span className="text-text-secondary text-xs">{w.field_name ?? w.well_name}</span>
                    </div>
                    <RiskBadge level="MEDIUM" />
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      </div>

      {/* Risk Categories */}
      {risk_categories?.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-4 flex items-center gap-2">
            <Shield size={12} /> Risk Categories — Historical Event Counts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {risk_categories.map((cat: any, idx: number) => (
              <div key={idx} className="bg-background border border-border rounded p-4 text-center">
                <div className="text-xs uppercase tracking-widest text-text-muted mb-2">{cat.name}</div>
                <div className="text-2xl font-bold text-text-primary mb-1">{cat.event_count.toLocaleString()}</div>
                <div className="mt-1"><RiskBadge level={cat.risk_level} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
