import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldMap } from '../components/map/FieldMap';
import type { WellPoint, CandidatePoint } from '../components/map/types';
import { MapPin, Target, Sparkles, RefreshCw } from 'lucide-react';
import { evaluateCandidate as apiEvaluate, getRecommendedCandidates, useWells } from '../api';

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? '#087F73' : value >= 65 ? '#C78A2C' : '#737373';
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1 text-xs">
        <span className="text-text-secondary">{label}</span>
        <span style={{ color }} className="font-bold">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div style={{ width: `${value}%`, background: color, transition: 'width 0.7s ease' }} className="h-full rounded-full" />
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const cfg: Record<string, string> = {
    HIGH: 'bg-danger/10 text-danger border-danger/30',
    CRITICAL: 'bg-danger/10 text-danger border-danger/30',
    MEDIUM: 'bg-warning/10 text-warning border-warning/30',
    LOW: 'bg-success/10 text-success border-success/30',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${cfg[level?.toUpperCase()] ?? cfg.LOW}`}>
      {level}
    </span>
  );
}

export const CandidateEval = () => {
  const navigate = useNavigate();
  const { data: wellsData } = useWells();

  const [mode, setMode] = useState<'idle' | 'manual' | 'recommended'>('idle');
  const [candidate, setCandidate] = useState<{ lat: number; lng: number } | null>(null);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedCand, setSelectedCand] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fly-to state — updated when a candidate is selected
  const [flyTo, setFlyTo] = useState<{lat: number; lng: number; zoom?: number} | null>(null);
  // Evidence arrows — staggered reveal count
  const [visibleArrowCount, setVisibleArrowCount] = useState(0);

  // Auto-select Candidate A when recommendations arrive
  useEffect(() => {
    if (recommendations.length > 0 && !selectedCand) {
      const first = recommendations[0];
      console.log(`[CANDIDATE SELECT] candidate=${first.candidate_label} lat=${first.latitude} lng=${first.longitude}`);
      setSelectedCand(first);
      setFlyTo({ lat: first.latitude, lng: first.longitude, zoom: 11 });
    }
  }, [recommendations]);

  const mapWells: WellPoint[] = wellsData ? wellsData.map((w: any) => ({
    id: w.well_id,
    name: w.well_name,
    field_name: w.field_name || '',
    lat: w.latitude,
    lng: w.longitude,
    status: w.status,
    risk: w.status === 'ACTIVE' ? 'MEDIUM' : 'LOW',
    depth: w.current_depth || 0,
    formation: w.current_formation,
  })) : [];

  const candidateMarkers: CandidatePoint[] = recommendations.map((r, i) => ({
    id: r.candidate_id,
    label: r.candidate_label || String.fromCharCode(65 + i),
    lat: r.latitude,
    lng: r.longitude,
    suitability: r.overall_suitability,
    risk: r.drilling_risk?.level || 'LOW',
    supportingWells: r.supporting_wells?.map((sw: any) => ({ lat: sw.latitude, lng: sw.longitude })) || [],
  }));

  // Influencing well IDs for the selected candidate (top 3-5 by proximity)
  const influencingWellIds: string[] = selectedCand?.supporting_wells
    ?.slice(0, 5)
    .map((sw: any) => sw.well_id)
    .filter(Boolean) || [];

  // Debug logging
  useEffect(() => {
    if (selectedCand) {
      console.log(`[CANDIDATE EVIDENCE] candidate=${selectedCand.candidate_label}`);
      console.log(`[CANDIDATE EVIDENCE] supporting wells=${Math.min(selectedCand.supporting_wells?.length || 0, 5)}`);
      console.log(`[CANDIDATE EVIDENCE] primary well=${influencingWellIds[0] || 'None'}`);
      console.log(`[CANDIDATE EVIDENCE] highlighted wells=[${influencingWellIds.join(', ')}]`);
      console.log(`[CANDIDATE EVIDENCE] lines rendered=${Math.min(selectedCand.supporting_wells?.length || 0, 5)}`);
    }
  }, [selectedCand, influencingWellIds]);



  const handleMapClick = (lat: number, lng: number) => {
    setMode('manual');
    setCandidate({ lat, lng });
    setEvalResult(null);
    setSelectedCand(null);
    setError(null);
  };

  const runEvaluate = async () => {
    if (!candidate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiEvaluate(candidate.lat, candidate.lng);
      setEvalResult(res);
    } catch (e: any) {
      setError('Evaluation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const runRecommended = async () => {
    setMode('recommended');
    setRecLoading(true);
    setRecommendations([]);
    setSelectedCand(null);
    setEvalResult(null);
    setError(null);
    try {
      const res = await getRecommendedCandidates();
      const cands = res.candidates || [];
      setRecommendations(cands);
      // Auto-select first candidate after load
      if (cands.length > 0) {
        const first = cands[0];
        console.log(`[CANDIDATE SELECT] candidate=${first.candidate_label} lat=${first.latitude} lng=${first.longitude}`);
        setSelectedCand(first);
        setFlyTo({ lat: first.latitude, lng: first.longitude, zoom: 11 });
      }
    } catch (e: any) {
      setError('Unable to generate recommended locations. Please try again.');
    } finally {
      setRecLoading(false);
    }
  };

  const handleCandidateClick = (candId: string) => {
    console.log(`[CANDIDATE SELECT] from map marker, candidate=${candId}`);
    const c = recommendations.find(r => r.candidate_id === candId);
    if (c) {
      setSelectedCand(c);
      setVisibleArrowCount(0);
      setFlyTo({ lat: c.latitude, lng: c.longitude, zoom: 11 });
      const total = Math.min(c.supporting_wells?.length || 0, 5);
      for (let i = 1; i <= total; i++) {
        setTimeout(() => setVisibleArrowCount(i), i * 130);
      }
      // Scroll the card into view
      setTimeout(() => {
        cardRefs.current[candId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
    }
  };

  const handleCardSelect = (r: any) => {
    const toggled = selectedCand?.candidate_id === r.candidate_id ? null : r;
    console.log(`[CANDIDATE CARD] selected=${toggled?.candidate_label ?? 'none'} lat=${r.latitude} lng=${r.longitude}`);
    setSelectedCand(toggled);
    setVisibleArrowCount(0);
    if (toggled) {
      setFlyTo({ lat: toggled.latitude, lng: toggled.longitude, zoom: 11 });
      // Stagger arrow reveals: +1 every 130ms
      const total = Math.min(toggled.supporting_wells?.length || 0, 5);
      for (let i = 1; i <= total; i++) {
        setTimeout(() => setVisibleArrowCount(i), i * 130);
      }
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1 tracking-tight">Candidate Location Evaluation</h2>
        <p className="text-text-secondary text-sm">
          Evaluate a proposed drilling location using nearby well intelligence and historical analogy.
        </p>
      </div>

      {/* Mode Controls */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => { setMode('manual'); setRecommendations([]); setSelectedCand(null); setEvalResult(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest transition-colors border ${mode === 'manual' ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'}`}
        >
          <MapPin size={14} /> Select Location
        </button>
        <button
          onClick={runRecommended}
          disabled={recLoading}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest transition-colors border border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={14} />
          {recLoading ? 'Analyzing...' : 'Find Recommended Locations'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Map */}
        <div className="lg:col-span-2 bg-surface rounded-lg border border-border overflow-hidden relative z-0" style={{ minHeight: '400px' }}>
          {recLoading && (
            <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center space-y-3 text-sm text-text-secondary">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="animate-pulse">Analyzing field context...</div>
            </div>
          )}
          <FieldMap
            wells={mapWells}
            candidates={candidateMarkers}
            candidateLocation={mode === 'manual' ? candidate : null}
            onMapClick={mode === 'manual' || mode === 'idle' ? handleMapClick : undefined}
            onCandidateClick={handleCandidateClick}
            selectedCandId={selectedCand?.candidate_id ?? null}
            flyToLocation={flyTo}
            selectedCandData={selectedCand}
            visibleArrowCount={visibleArrowCount}
          />
        </div>

        {/* Right Panel */}
        <div className="bg-surface rounded-lg border border-border p-4 flex flex-col overflow-y-auto">

          {/* Manual Mode Panel */}
          {mode === 'manual' && (
            <>
              <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary border-b border-border pb-3 mb-4 flex items-center gap-2">
                <Target size={14} className="text-primary" /> Evaluation Panel
              </h3>

              {!candidate ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center text-text-secondary py-10">
                  <MapPin size={40} className="mb-4 opacity-20" />
                  <p className="text-sm">Click anywhere on the map<br />to place a candidate location.</p>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <div className="bg-background rounded p-3 border border-border text-xs font-mono">
                    <div className="flex justify-between mb-1">
                      <span className="text-text-secondary">Latitude</span>
                      <span>{candidate.lat.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Longitude</span>
                      <span>{candidate.lng.toFixed(5)}</span>
                    </div>
                  </div>

                  <button onClick={runEvaluate} disabled={loading}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded text-sm uppercase tracking-widest transition-colors disabled:opacity-50">
                    {loading ? 'Evaluating...' : 'Evaluate Candidate'}
                  </button>

                  {error && <p className="text-danger text-xs">{error}</p>}

                  {evalResult && !evalResult.suitability_label?.includes('INSUFFICIENT') && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                      <div className="bg-background border border-border rounded p-4 text-center">
                        <div className="text-text-secondary text-[10px] uppercase tracking-widest mb-1">Overall Suitability</div>
                        <div className="text-3xl font-bold text-primary">{evalResult.overall_suitability}<span className="text-sm text-text-secondary">/100</span></div>
                        <div className="text-xs text-text-secondary mt-1">{evalResult.suitability_label}</div>
                      </div>

                      <div className="space-y-1">
                        <ScoreBar label="Geological Suitability" value={evalResult.geological_suitability} />
                        <ScoreBar label="Reservoir Quality" value={evalResult.reservoir_quality} />
                        <ScoreBar label="Formation Continuity" value={evalResult.formation_continuity} />
                        <ScoreBar label="Offset Evidence" value={evalResult.offset_evidence} />
                        <ScoreBar label="Spatial Confidence" value={evalResult.spatial_confidence} />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-text-secondary">Drilling Risk</span>
                        <RiskBadge level={evalResult.drilling_risk?.level || 'LOW'} />
                      </div>

                      <div className="bg-background rounded border border-border p-3 text-xs">
                        <div className="font-bold text-primary mb-2 uppercase tracking-wide">Recommendation</div>
                        <p className="text-text-primary">{evalResult.recommendation}</p>
                      </div>

                      {evalResult.explanation?.positives?.length > 0 && (
                        <div className="text-xs space-y-1">
                          {evalResult.explanation.positives.map((p: string, i: number) => (
                            <div key={i} className="text-success flex gap-1.5">+ {p}</div>
                          ))}
                          {evalResult.explanation.concerns.map((c: string, i: number) => (
                            <div key={i} className="text-warning flex gap-1.5">⚠ {c}</div>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-text-muted border-t border-border pt-2">{evalResult.disclaimer}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Recommended Mode Panel */}
          {mode === 'recommended' && (
            <>
              <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary border-b border-border pb-3 mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-primary" /> Recommended Locations
              </h3>

              {error && (
                <div className="text-center py-6 space-y-3">
                  <p className="text-danger text-sm">{error}</p>
                  <button onClick={runRecommended} className="flex items-center gap-2 mx-auto text-sm text-primary hover:underline">
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              )}

              {!error && !recLoading && recommendations.length === 0 && (
                <div className="text-center py-10 text-text-secondary text-sm">No candidate locations found.</div>
              )}

              {/* Candidate Cards */}
              {recommendations.map((r, i) => (
                <div
                  key={r.candidate_id}
                  ref={el => { cardRefs.current[r.candidate_id] = el; }}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardSelect(r)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCardSelect(r); }}
                  className={`mb-3 p-3 rounded border cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    selectedCand?.candidate_id === r.candidate_id
                      ? 'border-primary bg-primary/5 border-l-2 border-l-primary'
                      : 'border-border hover:border-primary/40 hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs transition-colors ${
                        selectedCand?.candidate_id === r.candidate_id ? 'border-[#13A89E] text-[#13A89E]' : 'border-primary text-primary'
                      }`}>
                        {r.candidate_label || String.fromCharCode(65+i)}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide">
                          Candidate {r.candidate_label || String.fromCharCode(65+i)}
                        </div>
                        {r.field_name && (
                          <div className="text-[10px] text-text-secondary font-mono tracking-wide">{r.field_name}</div>
                        )}
                      </div>
                    </div>
                    <RiskBadge level={r.drilling_risk?.level || 'LOW'} />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-secondary text-xs">Suitability</span>
                    <span className="font-bold text-primary">{r.overall_suitability}/100</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
                    <div style={{ width: `${r.overall_suitability}%`, background: '#087F73', transition: 'width 0.7s ease' }} className="h-full rounded-full" />
                  </div>
                  <p className="text-[10px] text-text-secondary">{r.recommendation}</p>

                  {/* Expanded detail */}
                  {selectedCand?.candidate_id === r.candidate_id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in duration-200">
                      {/* Coordinates */}
                      <div className="bg-background rounded p-2 border border-border font-mono text-[10px] flex gap-4">
                        <div><span className="text-text-secondary">LAT </span>{r.latitude?.toFixed(5)}</div>
                        <div><span className="text-text-secondary">LNG </span>{r.longitude?.toFixed(5)}</div>
                      </div>
                      <ScoreBar label="Geological Suitability" value={r.geological_suitability} />
                      <ScoreBar label="Reservoir Quality" value={r.reservoir_quality} />
                      <ScoreBar label="Formation Continuity" value={r.formation_continuity} />
                      <ScoreBar label="Offset Evidence" value={r.offset_evidence} />
                      <ScoreBar label="Spatial Confidence" value={r.spatial_confidence} />

                      <div className="flex justify-between text-xs mt-2">
                        <span className="text-text-secondary">Nearby Wells</span>
                        <span>{r.nearby_wells_count}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">Nearest Well</span>
                        <span>{r.nearest_well} ({r.nearest_distance_km} km)</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">Historical Similarity</span>
                        <span className="text-primary font-bold">{r.historical_similarity}%</span>
                      </div>

                      {r.explanation?.positives?.length > 0 && (
                        <div className="text-[10px] space-y-1 pt-2 border-t border-border">
                          <div className="font-bold text-text-secondary uppercase tracking-wide mb-1">Why this location?</div>
                          {r.explanation.positives.map((p: string, j: number) => (
                            <div key={j} className="text-success">+ {p}</div>
                          ))}
                          {r.explanation.concerns.map((c: string, j: number) => (
                            <div key={j} className="text-warning">⚠ {c}</div>
                          ))}
                        </div>
                      )}

                      {r.supporting_wells?.length > 0 && (
                        <div className="text-[10px] pt-3 pb-1 border-t border-border mt-2">
                          <div className="font-bold text-primary uppercase tracking-wide mb-2 flex items-center gap-2">
                            <Sparkles size={12} /> Evidence Driving Recommendation
                          </div>
                          
                          <div className="bg-primary/5 border border-primary/20 rounded p-2 mb-2">
                            <div className="text-text-secondary text-[9px] uppercase tracking-wider mb-1">Primary Influencing Well</div>
                            <div className="font-bold text-[#13A89E] flex justify-between items-center cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/wells/${r.supporting_wells[0].well_id}`); }}>
                              {r.supporting_wells[0].well_id}
                              <span className="text-text-muted text-[9px] font-normal">{r.supporting_wells[0].distance_km} km</span>
                            </div>
                            <div className="text-text-muted text-[9px] mt-1">
                              Formation: {r.supporting_wells[0].current_formation || 'Unknown'}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-text-secondary">Total Supporting Wells:</span>
                            <span className="font-bold">{r.supporting_wells.length}</span>
                          </div>

                          <div className="space-y-1">
                            {r.supporting_wells.slice(1, 5).map((sw: any) => (
                              <div key={sw.well_id}
                                onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/wells/${sw.well_id}`); }}
                                className="flex justify-between py-1 px-1 hover:bg-surface-hover rounded cursor-pointer border border-transparent hover:border-border transition-colors">
                                <span className="text-text-primary">{sw.well_id}</span>
                                <span className="text-text-muted">{sw.distance_km} km</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-[9px] text-text-muted pt-1">{r.disclaimer}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Idle state */}
          {mode === 'idle' && (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-10 space-y-4">
              <Target size={40} className="text-text-muted opacity-30" />
              <p className="text-text-secondary text-sm">Choose a mode to begin evaluation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
