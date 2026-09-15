import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldMap } from '../components/map/FieldMap';
import type { WellPoint, CandidatePoint } from '../components/map/types';
import { Target, Sparkles, RefreshCw, MapPin, Crosshair, CheckCircle, Map, ChevronRight } from 'lucide-react';
import { getRecommendedCandidates, evaluateCandidate, useWells } from '../api';

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

  // 'idle' | 'selecting' | 'select_result' | 'recommended'
  const [mode, setMode] = useState<'idle' | 'selecting' | 'select_result' | 'recommended'>('idle');

  // FIND RECOMMENDED LOCATIONS state
  const [recLoading, setRecLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedCand, setSelectedCand] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fly-to state — updated when a candidate is selected
  const [flyTo, setFlyTo] = useState<{lat: number; lng: number; zoom?: number} | null>(null);
  // Evidence arrows — staggered reveal count
  const [visibleArrowCount, setVisibleArrowCount] = useState(0);

  // SELECT LOCATION state
  const [selectEvalLoading, setSelectEvalLoading] = useState(false);
  const [selectEvalResult, setSelectEvalResult] = useState<any>(null);
  const [selectEvalError, setSelectEvalError] = useState<string | null>(null);
  const [engineerLocation, setEngineerLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // SELECT REGION state
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionBounds, setRegionBounds] = useState<[[number,number],[number,number]] | null>(null);

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

  const influencingWellIds: string[] = selectedCand?.supporting_wells
    ?.slice(0, 5)
    .map((sw: any) => sw.well_id)
    .filter(Boolean) || [];

  useEffect(() => {
    if (selectedCand) {
      console.log(`[CANDIDATE EVIDENCE] candidate=${selectedCand.candidate_label}`);
      console.log(`[CANDIDATE EVIDENCE] supporting wells=${Math.min(selectedCand.supporting_wells?.length || 0, 5)}`);
      console.log(`[CANDIDATE EVIDENCE] primary well=${influencingWellIds[0] || 'None'}`);
      console.log(`[CANDIDATE EVIDENCE] highlighted wells=[${influencingWellIds.join(', ')}]`);
      console.log(`[CANDIDATE EVIDENCE] lines rendered=${Math.min(selectedCand.supporting_wells?.length || 0, 5)}`);
    }
  }, [selectedCand, influencingWellIds]);

  const runRecommended = async () => {
    setMode('recommended');
    setRecLoading(true);
    setRecommendations([]);
    setSelectedCand(null);
    setError(null);
    setEngineerLocation(null);
    setSelectEvalResult(null);
    setSelectEvalError(null);
    try {
      const res = await getRecommendedCandidates();
      const cands = res.candidates || [];
      setRecommendations(cands);
    } catch (e: any) {
      setError('Unable to generate recommended locations. Please try again.');
    } finally {
      setRecLoading(false);
    }
  };

  const enterSelectionMode = () => {
    setMode('selecting');
    setRecommendations([]);
    setSelectedCand(null);
    setError(null);
    setSelectEvalResult(null);
    setSelectEvalError(null);
    setEngineerLocation(null);
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (mode !== 'selecting') return;

    console.log(`[SELECT LOCATION] Engineer clicked lat=${lat.toFixed(6)} lng=${lng.toFixed(6)}`);
    setEngineerLocation({ lat, lng });
    setSelectEvalLoading(true);
    setSelectEvalError(null);
    setSelectEvalResult(null);
    setMode('select_result');
    // Removed setFlyTo so map viewport is preserved

    try {
      const result = await evaluateCandidate(lat, lng);
      console.log(`[SELECT LOCATION] Evaluation complete: suitability=${result.overall_suitability}`);
      setSelectEvalResult(result);
      
      // Reveal evidence arrows sequentially
      setVisibleArrowCount(0);
      const total = Math.min(result.supporting_wells?.length || 0, 5);
      for (let i = 1; i <= total; i++) {
        setTimeout(() => setVisibleArrowCount(i), i * 130);
      }
    } catch (e: any) {
      console.error('[SELECT LOCATION] Evaluation failed', e);
      setSelectEvalError('Could not evaluate this location. Ensure the backend is running and the location is within a mapped field.');
    } finally {
      setSelectEvalLoading(false);
    }
  }, [mode]);

  const handleCandidateClick = (candId: string) => {
    console.log(`[CANDIDATE SELECT] from map marker, candidate=${candId}`);
    const c = recommendations.find(r => r.candidate_id === candId);
    if (c) {
      setSelectedCand(c);
      setVisibleArrowCount(0);
      // Removed setFlyTo so map viewport is preserved when clicking a marker
      const total = Math.min(c.supporting_wells?.length || 0, 5);
      for (let i = 1; i <= total; i++) {
        setTimeout(() => setVisibleArrowCount(i), i * 130);
      }
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
      const total = Math.min(toggled.supporting_wells?.length || 0, 5);
      for (let i = 1; i <= total; i++) {
        setTimeout(() => setVisibleArrowCount(i), i * 130);
      }
    }
  };

  const isSelecting = mode === 'selecting';
  const activeCandidateMarkers = mode === 'recommended' ? candidateMarkers : (mode === 'select_result' && selectEvalResult ? [{
    id: selectEvalResult.candidate_id,
    label: selectEvalResult.candidate_label || 'EVAL',
    lat: selectEvalResult.latitude,
    lng: selectEvalResult.longitude,
    suitability: selectEvalResult.overall_suitability,
    risk: selectEvalResult.drilling_risk?.level || 'LOW',
    supportingWells: selectEvalResult.supporting_wells?.map((sw: any) => ({ lat: sw.latitude, lng: sw.longitude })) || [],
  }] : []);
  const activeCandId = mode === 'recommended' ? (selectedCand?.candidate_id ?? null) : (mode === 'select_result' ? selectEvalResult?.candidate_id : null);
  const activeCandData = mode === 'recommended' ? selectedCand : (mode === 'select_result' ? selectEvalResult : null);
  const activeVisibleArrows = (mode === 'recommended' || mode === 'select_result') ? visibleArrowCount : 0;
  const activeEngineerLocation = (mode === 'select_result' || mode === 'selecting') ? engineerLocation : null;
  const activeMapClick = mode === 'selecting' ? handleMapClick : undefined;

  const uniqueRegions = Array.from(new Set(mapWells.map(w => w.field_name).filter(Boolean))).sort();

  const handleSelectRegion = (region: string) => {
    setIsRegionSelectorOpen(false);
    setSelectedRegion(region);
    
    const regionWells = mapWells.filter(w => w.field_name === region && w.lat && w.lng);
    if (regionWells.length > 0) {
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      regionWells.forEach(w => {
        if (w.lat < minLat) minLat = w.lat;
        if (w.lat > maxLat) maxLat = w.lat;
        if (w.lng < minLng) minLng = w.lng;
        if (w.lng > maxLng) maxLng = w.lng;
      });
      setRegionBounds([[minLat, minLng], [maxLat, maxLng]]);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1 tracking-tight">Candidate Location Evaluation</h2>
        <p className="text-text-secondary text-sm">
          Evaluate a proposed drilling location using nearby well intelligence and historical analogy.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={enterSelectionMode}
          disabled={selectEvalLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === 'selecting'
              ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : mode === 'select_result'
              ? 'border-amber-600/50 text-amber-500/80 hover:bg-amber-500/10 hover:border-amber-500'
              : 'border-border text-text-secondary hover:border-amber-500/60 hover:text-amber-400'
          }`}
        >
          {mode === 'selecting' ? (
            <>
              <Crosshair size={14} className="animate-pulse" />
              Selecting…
            </>
          ) : mode === 'select_result' && !selectEvalLoading ? (
            <>
              <CheckCircle size={14} />
              Location Selected
            </>
          ) : (
            <>
              <MapPin size={14} />
              Select Location
            </>
          )}
        </button>

        <button
          onClick={runRecommended}
          disabled={recLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === 'recommended'
              ? 'bg-primary/10 border-primary text-primary shadow-[0_0_12px_rgba(8,127,115,0.25)]'
              : 'border-border text-text-secondary hover:border-primary/60 hover:text-primary'
          }`}
        >
          <Sparkles size={14} />
          {recLoading ? 'Analyzing...' : 'Find Recommended Locations'}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsRegionSelectorOpen(!isRegionSelectorOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest transition-all border border-border text-text-secondary hover:border-primary/60 hover:text-primary"
          >
            <Map size={14} />
            Select Region
          </button>
          
          {isRegionSelectorOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-border rounded shadow-xl z-50 py-2 flex flex-col max-h-64 overflow-y-auto">
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-3 py-1 mb-1 border-b border-border">Regions</div>
              {uniqueRegions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-muted">Loading...</div>
              ) : (
                uniqueRegions.map(region => (
                  <button
                    key={region}
                    onClick={() => handleSelectRegion(region)}
                    className="flex items-center justify-between px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-hover hover:text-primary transition-colors"
                  >
                    <span>{region}</span>
                    <ChevronRight size={12} className="opacity-50" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {mode === 'selecting' && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm animate-in fade-in duration-200">
          <Crosshair size={16} className="shrink-0 animate-pulse" />
          <span>
            <span className="font-bold">Click anywhere within the mapped field</span> to evaluate a proposed drilling location.
          </span>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div
          className={`lg:col-span-2 bg-surface rounded-lg border overflow-hidden relative z-0 transition-colors ${
            isSelecting ? 'border-amber-500/50' : 'border-border'
          }`}
          style={{ minHeight: '400px' }}
        >
          {selectedRegion && (
            <div className="absolute top-4 left-4 z-[400] bg-surface/90 backdrop-blur border border-border rounded px-3 py-1.5 shadow-lg pointer-events-none">
              <div className="text-[9px] text-text-secondary uppercase tracking-widest mb-0.5">Selected Region</div>
              <div className="text-xs font-bold text-primary uppercase tracking-wide">{selectedRegion}</div>
            </div>
          )}
          
          {(recLoading || selectEvalLoading) && (
            <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center space-y-3 text-sm text-text-secondary">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="animate-pulse">
                {recLoading ? 'Analyzing field context…' : 'Evaluating location…'}
              </div>
            </div>
          )}
          <FieldMap
            wells={mapWells}
            candidates={activeCandidateMarkers}
            candidateLocation={activeEngineerLocation}
            onMapClick={activeMapClick}
            onCandidateClick={handleCandidateClick}
            selectedCandId={activeCandId}
            flyToLocation={flyTo}
            selectedCandData={activeCandData}
            visibleArrowCount={activeVisibleArrows}
            selectionMode={isSelecting}
            regionBounds={regionBounds}
          />
        </div>

        <div className="bg-surface rounded-lg border border-border p-4 flex flex-col overflow-y-auto">
          {mode === 'select_result' && (
            <>
              <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary border-b border-border pb-3 mb-4 flex items-center gap-2">
                <MapPin size={14} className="text-amber-400" />
                <span className="text-amber-400">Engineer-Selected Location</span>
              </h3>

              {selectEvalLoading && (
                <div className="flex flex-col items-center justify-center flex-1 py-10 space-y-3 text-text-secondary text-sm">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <div className="animate-pulse">Evaluating location…</div>
                </div>
              )}

              {selectEvalError && !selectEvalLoading && (
                <div className="space-y-3 py-4">
                  <p className="text-danger text-sm">{selectEvalError}</p>
                  <button
                    onClick={enterSelectionMode}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <RefreshCw size={12} /> Try another location
                  </button>
                </div>
              )}

              {selectEvalResult && !selectEvalLoading && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="bg-background rounded p-2.5 border border-border font-mono text-[10px] flex gap-4">
                    <div><span className="text-text-secondary">LAT </span>{selectEvalResult.latitude?.toFixed(6)}</div>
                    <div><span className="text-text-secondary">LNG </span>{selectEvalResult.longitude?.toFixed(6)}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-xs">Overall Suitability</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg" style={{
                        color: selectEvalResult.overall_suitability >= 80 ? '#087F73'
                          : selectEvalResult.overall_suitability >= 65 ? '#C78A2C' : '#737373'
                      }}>
                        {selectEvalResult.overall_suitability}/100
                      </span>
                      {selectEvalResult.drilling_risk?.level && (
                        <RiskBadge level={selectEvalResult.drilling_risk.level} />
                      )}
                    </div>
                  </div>

                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${selectEvalResult.overall_suitability}%`,
                        background: selectEvalResult.overall_suitability >= 80 ? '#087F73'
                          : selectEvalResult.overall_suitability >= 65 ? '#C78A2C' : '#737373',
                        transition: 'width 0.7s ease'
                      }}
                      className="h-full rounded-full"
                    />
                  </div>

                  {selectEvalResult.recommendation && (
                    <p className="text-xs text-text-secondary italic border-l-2 border-primary/40 pl-2">
                      {selectEvalResult.recommendation}
                    </p>
                  )}

                  <div className="border-t border-border pt-3 space-y-1">
                    {selectEvalResult.geological_suitability !== undefined && (
                      <ScoreBar label="Geological Suitability" value={selectEvalResult.geological_suitability} />
                    )}
                    {selectEvalResult.reservoir_quality !== undefined && (
                      <ScoreBar label="Reservoir Quality" value={selectEvalResult.reservoir_quality} />
                    )}
                    {selectEvalResult.formation_continuity !== undefined && (
                      <ScoreBar label="Formation Continuity" value={selectEvalResult.formation_continuity} />
                    )}
                    {selectEvalResult.historical_risk_score !== undefined && (
                      <ScoreBar label="Historical / Offset Evidence" value={selectEvalResult.historical_risk_score} />
                    )}
                    {selectEvalResult.spatial_confidence !== undefined && (
                      <ScoreBar label="Spatial Confidence" value={selectEvalResult.spatial_confidence} />
                    )}
                  </div>

                  {selectEvalResult.nearby_wells_count !== undefined && (
                    <div className="border-t border-border pt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">Nearby Supporting Wells</span>
                        <span>{selectEvalResult.nearby_wells_count}</span>
                      </div>
                      {selectEvalResult.nearest_well && (
                        <div className="flex justify-between text-xs">
                          <span className="text-text-secondary">Nearest Well</span>
                          <span>{selectEvalResult.nearest_well} ({selectEvalResult.nearest_distance_km} km)</span>
                        </div>
                      )}
                      {selectEvalResult.historical_similarity !== undefined && (
                        <div className="flex justify-between text-xs">
                          <span className="text-text-secondary">Historical Similarity</span>
                          <span className="text-primary font-bold">{selectEvalResult.historical_similarity}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectEvalResult.drilling_risk && (
                    <div className="border-t border-border pt-3">
                      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Target size={10} /> Drilling Risk
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                        {[
                          ['Mud Loss', selectEvalResult.drilling_risk.mud_loss_events],
                          ['Stuck Pipe', selectEvalResult.drilling_risk.stuck_pipe_events],
                          ['Kicks', selectEvalResult.drilling_risk.kick_events],
                          ['High Torque', selectEvalResult.drilling_risk.high_torque_events],
                        ].map(([label, val]) => (
                          <div key={String(label)} className="flex justify-between">
                            <span className="text-text-secondary">{label}</span>
                            <span className={Number(val) > 0 ? 'text-warning' : 'text-text-muted'}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectEvalResult.explanation?.positives?.length > 0 && (
                    <div className="border-t border-border pt-3 text-[10px] space-y-1">
                      <div className="font-bold text-text-secondary uppercase tracking-wide mb-1">Why this location?</div>
                      {selectEvalResult.explanation.positives.map((p: string, j: number) => (
                        <div key={j} className="text-success">+ {p}</div>
                      ))}
                      {selectEvalResult.explanation.concerns?.map((c: string, j: number) => (
                        <div key={j} className="text-warning">⚠ {c}</div>
                      ))}
                    </div>
                  )}

                  {selectEvalResult.supporting_wells?.length > 0 && (
                    <div className="border-t border-border pt-3 text-[10px]">
                      <div className="font-bold text-primary uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Sparkles size={10} /> Nearby Well Evidence
                      </div>
                      <div className="space-y-1">
                        {selectEvalResult.supporting_wells.slice(0, 5).map((sw: any) => (
                          <div
                            key={sw.well_id}
                            onClick={() => navigate(`/dashboard/wells/${sw.well_id}`)}
                            className="flex justify-between py-1 px-1 hover:bg-surface-hover rounded cursor-pointer border border-transparent hover:border-border transition-colors"
                          >
                            <span className="text-text-primary">{sw.well_id}</span>
                            <span className="text-text-muted">{sw.distance_km} km</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectEvalResult.disclaimer && (
                    <p className="text-[9px] text-text-muted pt-1">{selectEvalResult.disclaimer}</p>
                  )}

                  <button
                    onClick={enterSelectionMode}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-widest hover:bg-amber-500/10 transition-colors"
                  >
                    <Crosshair size={12} /> Select Another Location
                  </button>
                </div>
              )}
            </>
          )}

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

                  {selectedCand?.candidate_id === r.candidate_id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in duration-200">
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

          {mode === 'idle' && (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-10 space-y-4">
              <Target size={40} className="text-text-muted opacity-30" />
              <p className="text-text-secondary text-sm max-w-[220px]">
                Choose a workflow to begin.
              </p>
              <div className="text-xs text-text-muted space-y-1 text-left border border-border rounded p-3 bg-background w-full">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={10} className="text-amber-400 shrink-0" />
                  <span className="font-bold text-amber-400 uppercase tracking-wide text-[10px]">Select Location</span>
                </div>
                <p className="text-[10px] text-text-muted mb-3">You propose a location — NWIS evaluates it.</p>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={10} className="text-primary shrink-0" />
                  <span className="font-bold text-primary uppercase tracking-wide text-[10px]">Find Recommended Locations</span>
                </div>
                <p className="text-[10px] text-text-muted">NWIS analyzes well intelligence and recommends candidate locations.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
