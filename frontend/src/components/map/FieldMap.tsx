import React, { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polygon, Tooltip, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import type { WellPoint, CandidatePoint } from './types';

export type { WellPoint, CandidatePoint };

// ── Coordinate validation ─────────────────────────────────────────────────────
export function isValidCoordinate(lat: any, lng: any): boolean {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

// ── Convex hull helpers ───────────────────────────────────────────────────────
function cross(O: [number,number], A: [number,number], B: [number,number]) {
  return (A[0]-O[0])*(B[1]-O[1])-(A[1]-O[1])*(B[0]-O[0]);
}
function convexHull(points: [number,number][]): [number,number][] {
  const n = points.length;
  if (n < 3) return points;
  const sorted = [...points].sort((a,b) => a[1]!==b[1] ? a[1]-b[1] : a[0]-b[0]);
  const lower: [number,number][] = [];
  for (const p of sorted) {
    while (lower.length>=2 && cross(lower[lower.length-2], lower[lower.length-1], p)<=0) lower.pop();
    lower.push(p);
  }
  const upper: [number,number][] = [];
  for (let i=sorted.length-1;i>=0;i--) {
    const p=sorted[i];
    while (upper.length>=2 && cross(upper[upper.length-2], upper[upper.length-1], p)<=0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return [...lower,...upper];
}
function padHull(hull: [number,number][], pad: number): [number,number][] {
  if (!hull.length) return hull;
  const cx=hull.reduce((s,p)=>s+p[0],0)/hull.length;
  const cy=hull.reduce((s,p)=>s+p[1],0)/hull.length;
  return hull.map(([lat,lng])=>{
    const dl=lat-cx, dg=lng-cy, mag=Math.sqrt(dl*dl+dg*dg)||1;
    return [lat+(dl/mag)*pad, lng+(dg/mag)*pad] as [number,number];
  });
}

// ── CSS injection ─────────────────────────────────────────────────────────────
const STYLE_ID = 'nwis-map-style';
function injectMapCSS() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes nwis-breathe {
      0%   { transform: scale(0.85); opacity: 0.7; }
      50%  { transform: scale(1.15); opacity: 0.05; }
      100% { transform: scale(0.85); opacity: 0.7; }
    }
    @keyframes nwis-evidence-pulse {
      0%   { transform: scale(0.75); opacity: 0.9; }
      50%  { transform: scale(1.30); opacity: 0.1; }
      100% { transform: scale(0.75); opacity: 0.9; }
    }
    @keyframes nwis-cand-pop {
      0%   { transform: scale(0.9); }
      60%  { transform: scale(1.18); }
      100% { transform: scale(1.0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .nwis-pulse-ring, .nwis-evidence-ring { animation: none !important; }
    }
    .nwis-pulse-ring   { animation: nwis-breathe 2s ease-in-out infinite; transform-origin: center center; }
    .nwis-evidence-ring { animation: nwis-evidence-pulse 1.6s ease-in-out infinite; transform-origin: center center; }
    .nwis-marker { background: transparent !important; border: none !important; }
  `;
  document.head.appendChild(style);
}

// ── Icon factories ────────────────────────────────────────────────────────────
function makeWellIcon(status: string, risk: string, selected: boolean, isInfluencing: boolean, influencingRank: number | null, hasCandidateSelected: boolean): L.DivIcon {
  injectMapCSS();
  const isActive = status === 'ACTIVE';
  let ringColor = '#13A89E';
  if (risk === 'HIGH' || risk === 'CRITICAL') ringColor = '#D94A4A';
  else if (risk === 'MEDIUM') ringColor = '#C78A2C';
  
  const isTop3 = influencingRank !== null && influencingRank < 3;
  const isPrimary = influencingRank === 0;
  
  const glowFilter = selected ? 'filter:drop-shadow(0 0 5px #13A89E);' : '';
  const scaleStyle = selected ? 'transform:scale(1.25);' : (isTop3 ? 'transform:scale(1.15);' : '');
  
  // Dim non-supporting wells when a candidate is selected
  const opacityStyle = hasCandidateSelected && !isInfluencing ? 'opacity:0.6;' : 'opacity:1;';

  const evidenceRingHtml = isInfluencing
    ? `<svg class="${isTop3 ? 'nwis-evidence-ring' : ''}" style="position:absolute;top:-6px;left:-6px;width:40px;height:40px;" viewBox="0 0 40 40">
         <circle cx="20" cy="20" r="17" fill="none" stroke="${ringColor}" stroke-width="${isPrimary ? '2.5' : '1.5'}" opacity="${isPrimary ? '0.9' : '0.8'}"/>
       </svg>`
    : '';

  if (isActive) {
    const html = `<div style="position:relative;width:28px;height:28px;${scaleStyle}transition:all 0.3s ease;${opacityStyle}">
      ${evidenceRingHtml}
      <svg class="nwis-pulse-ring" style="position:absolute;top:0;left:0;width:28px;height:28px;" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill="none" stroke="${ringColor}" stroke-width="2"/>
      </svg>
      <svg style="position:absolute;top:0;left:0;width:28px;height:28px;${glowFilter}" viewBox="0 0 28 28">
        <path d="M14 4 L24 14 L14 24 L4 14 Z" fill="#087F73" stroke="#13A89E" stroke-width="1.2"/>
        <circle cx="14" cy="14" r="2.5" fill="#0A0A0A"/>
      </svg>
    </div>`;
    return new L.DivIcon({ html, className:'nwis-marker', iconSize:[28,28], iconAnchor:[14,14] });
  }

  const inactiveEvidenceRingHtml = isInfluencing 
    ? `<svg class="${isTop3 ? 'nwis-evidence-ring' : ''}" style="position:absolute;top:-12px;left:-12px;width:40px;height:40px;" viewBox="0 0 40 40">
         <circle cx="20" cy="20" r="17" fill="none" stroke="${ringColor}" stroke-width="${isPrimary ? '2.5' : '1.5'}" opacity="${isPrimary ? '0.9' : '0.8'}"/>
       </svg>`
    : '';

  const html = `<div style="position:relative;width:16px;height:16px;${scaleStyle}transition:all 0.3s ease;${opacityStyle}">
    ${inactiveEvidenceRingHtml}
    <svg width="16" height="16" viewBox="0 0 16 16" style="${glowFilter};position:absolute;top:0;left:0;">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="#737373" stroke-width="1.4"/>
      <circle cx="8" cy="8" r="2.2" fill="#737373" fill-opacity="0.3"/>
    </svg>
  </div>`;
  return new L.DivIcon({ html, className:'nwis-marker', iconSize:[16,16], iconAnchor:[8,8] });
}

function makeCandidateIcon(label: string, suitability: number, risk: string, selected: boolean): L.DivIcon {
  injectMapCSS();
  const color = selected ? '#13A89E' : (suitability >= 80 ? '#087F73' : suitability >= 65 ? '#C78A2C' : '#737373');
  const ring  = selected ? '#13A89E' : (risk === 'HIGH' ? '#D94A4A' : risk === 'MEDIUM' ? '#C78A2C' : '#087F73');
  const glow  = selected ? 'filter:drop-shadow(0 0 10px #13A89E);' : '';
  const anim  = selected ? 'animation:nwis-cand-pop 0.5s ease;' : '';
  const ringW = selected ? '2.5' : '1.5';
  const outerR = selected ? '15' : '14';
  const halo  = selected ? `<circle cx="16" cy="16" r="16" fill="rgba(19,168,158,0.15)"/>` : '';
  const size  = selected ? 38 : 32;
  const anchor = Math.floor(size / 2);
  const html = `<div style="position:relative;width:${size}px;height:${size}px;${glow}${anim}">
    <svg viewBox="0 0 32 32" width="${size}" height="${size}">
      ${halo}
      <circle cx="16" cy="16" r="${outerR}" fill="none" stroke="${ring}" stroke-width="${ringW}" opacity="${selected?'0.9':'0.6'}"/>
      <circle cx="16" cy="16" r="10" fill="${color}" fill-opacity="${selected?'0.35':'0.2'}" stroke="${color}" stroke-width="${ringW}"/>
      <text x="16" y="21" text-anchor="middle" fill="${color}" font-size="11" font-weight="800" font-family="Inter,sans-serif">${label}</text>
    </svg>
  </div>`;
  return new L.DivIcon({ html, className:'nwis-marker', iconSize:[size,size], iconAnchor:[anchor,anchor] });
}

// ── Field palette ─────────────────────────────────────────────────────────────
const FIELD_PALETTE: [string,string][] = [
  ['assam','#087F73'],['brahmaputra','#087F73'],['gujarat','#13A89E'],
  ['cambay','#13A89E'],['rajasthan','#C78A2C'],['mumbai','#4A90D9'],
  ['krishna','#6A7DC9'],['digboi','#087F73'],['dibru','#087F73'],
  ['dihing','#5B9E9A'],['kadi','#13A89E'],['lohit','#6B8F71'],
  ['arunachal','#8A6B9F'],['northeast','#087F73'],['sanchor','#C78A2C'],
];
const FALLBACK = ['#737373','#5B7FA6','#6B8F71','#8A6B9F'];
function fieldColor(name: string) {
  const l = name.toLowerCase();
  for (const [k,c] of FIELD_PALETTE) if (l.includes(k)) return c;
  return FALLBACK[[...name].reduce((h,c)=>h+c.charCodeAt(0),0)%FALLBACK.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────
const MapFitter: React.FC<{wells: WellPoint[]}> = ({wells}) => {
  const map = useMap();
  const [fitted, setFitted] = useState(false);
  useEffect(() => {
    if (fitted || wells.length === 0) return;
    const pts = wells.filter(w=>isValidCoordinate(w.lat,w.lng)).map(w=>[w.lat,w.lng] as [number,number]);
    if (!pts.length) return;
    const b = L.latLngBounds(pts);
    if (b.isValid()) {
      map.fitBounds(b, {padding:[48,48], maxZoom:11});
      setFitted(true);
    }
  }, [wells, fitted, map]);
  return null;
};

const BoundsController: React.FC<{bounds?: [[number,number],[number,number]] | null}> = ({bounds}) => {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    const b = L.latLngBounds(bounds);
    if (b.isValid()) map.fitBounds(b, {padding:[48,48], maxZoom:12});
  }, [bounds, map]);
  return null;
};

const CameraController: React.FC<{center?:{lat:number;lng:number}|null; zoom?:number}> = ({center, zoom}) => {
  const map = useMap();
  useEffect(() => {
    if (!center || !isValidCoordinate(center.lat, center.lng)) return;
    console.log(`[CANDIDATE MAP] flyTo lat=${center.lat} lng=${center.lng} zoom=${zoom??11}`);
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    map.flyTo([center.lat, center.lng], zoom??11, { duration: rm ? 0 : 0.55 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, zoom]);
  return null;
};

const MapClickHandler: React.FC<{onMapClick?:(lat:number,lng:number)=>void}> = ({onMapClick}) => {
  const map = useMap();
  useEffect(() => {
    if (!onMapClick) return;
    const h = (e: L.LeafletMouseEvent) => onMapClick(e.latlng.lat, e.latlng.lng);
    map.on('click', h);
    return () => { map.off('click', h); };
  }, [map, onMapClick]);
  return null;
};

// ── Legend helpers ────────────────────────────────────────────────────────────
function LegendRow({svg, label}:{svg:string;label:string}) {
  return (<div style={{display:'flex',alignItems:'center',gap:'7px'}}>
    <span dangerouslySetInnerHTML={{__html:svg}}/><span style={{color:'#A3A3A3'}}>{label}</span>
  </div>);
}
const D = (fill:string,stroke:string,ring:string) => `<svg width="16" height="16" viewBox="0 0 28 28">
  ${ring!=='none'?`<circle cx="14" cy="14" r="12" fill="none" stroke="${ring}" stroke-width="2.5" opacity="0.7"/>`:''}
  <path d="M14 3 L25 14 L14 25 L3 14 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
  <circle cx="14" cy="14" r="2.5" fill="#0A0A0A"/></svg>`;
const O = (s:string) => `<svg width="14" height="14" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="${s}" stroke-width="1.4"/></svg>`;

// ── Well Quick-Card ───────────────────────────────────────────────────────────
interface WellQuickCardProps {
  well: WellPoint;
  onClose: () => void;
  onViewFull: (wellId: string) => void;
}
const WellQuickCard: React.FC<WellQuickCardProps> = ({ well, onClose, onViewFull }) => {
  return (
    <div style={{
      position:'absolute', bottom:80, right:16, zIndex:1000,
      background:'#171717', border:'1px solid #2A2A2A', borderRadius:8,
      minWidth:230, maxWidth:280, boxShadow:'0 8px 32px rgba(0,0,0,0.7)',
      fontFamily:'Inter,sans-serif', animation:'cardFadeIn 0.2s ease both',
    }}>
      <style>{`@keyframes cardFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
      {/* Header */}
      <div style={{padding:'12px 14px 8px', borderBottom:'1px solid #2A2A2A', display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <div style={{color:'#13A89E',fontWeight:800,fontSize:12,letterSpacing:'0.08em'}}>{well.id}</div>
          <div style={{color:'#F5F5F2',fontWeight:700,fontSize:14,marginTop:2}}>{well.name || well.id}</div>
        </div>
        <button onClick={onClose} style={{color:'#737373',background:'none',border:'none',cursor:'pointer',fontSize:16,lineHeight:1,paddingLeft:8}}>✕</button>
      </div>
      {/* Status badge */}
      <div style={{padding:'8px 14px 0', display:'flex', alignItems:'center', gap:8}}>
        <span style={{
          padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
          background: well.status==='ACTIVE' ? 'rgba(62,143,104,0.15)' : 'rgba(115,115,115,0.15)',
          color: well.status==='ACTIVE' ? '#3E8F68' : '#737373',
          border: `1px solid ${well.status==='ACTIVE' ? 'rgba(62,143,104,0.3)' : 'rgba(115,115,115,0.3)'}`,
        }}>{well.status}</span>
        <span style={{
          padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
          background: (well.risk==='HIGH'||well.risk==='CRITICAL') ? 'rgba(217,74,74,0.12)' : well.risk==='MEDIUM' ? 'rgba(199,138,44,0.12)' : 'rgba(62,143,104,0.1)',
          color: (well.risk==='HIGH'||well.risk==='CRITICAL') ? '#D94A4A' : well.risk==='MEDIUM' ? '#C78A2C' : '#3E8F68',
          border: `1px solid ${(well.risk==='HIGH'||well.risk==='CRITICAL') ? 'rgba(217,74,74,0.25)' : well.risk==='MEDIUM' ? 'rgba(199,138,44,0.25)' : 'rgba(62,143,104,0.2)'}`,
        }}>{well.risk} RISK</span>
      </div>
      {/* Data rows */}
      <div style={{padding:'10px 14px', display:'flex', flexDirection:'column', gap:6}}>
        {[
          ['Field', well.field_name || '—'],
          ['Depth', well.depth ? `${Math.round(well.depth).toLocaleString()} m` : '—'],
          ['Formation', well.formation || '—'],
        ].map(([label, val]) => (
          <div key={label} style={{display:'flex', justifyContent:'space-between', gap:12}}>
            <span style={{color:'#737373', fontSize:11}}>{label}</span>
            <span style={{color:'#F5F5F2', fontSize:11, fontWeight:600, textAlign:'right', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{val}</span>
          </div>
        ))}
        {well.supportingEvidence && (
          <div style={{marginTop:8, paddingTop:8, borderTop:'1px solid #2A2A2A', display:'flex', flexDirection:'column', gap:6}}>
            <div style={{color:'#13A89E', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2}}>Supporting Evidence for Candidate {well.supportingEvidence.candLabel}</div>
            <div style={{display:'flex', justifyContent:'space-between', gap:12}}>
              <span style={{color:'#737373', fontSize:11}}>Distance</span>
              <span style={{color:'#F5F5F2', fontSize:11, fontWeight:600}}>{well.supportingEvidence.distance} km</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', gap:12}}>
              <span style={{color:'#737373', fontSize:11}}>Similarity</span>
              <span style={{color:'#13A89E', fontSize:11, fontWeight:700}}>{well.supportingEvidence.similarity}%</span>
            </div>
          </div>
        )}
      </div>
      {/* CTA */}
      <div style={{padding:'0 14px 14px'}}>
        <button
          onClick={() => onViewFull(well.id)}
          style={{
            width:'100%', padding:'9px 0', background:'#087F73', color:'#F5F5F2',
            border:'none', borderRadius:6, fontWeight:700, fontSize:11, letterSpacing:'0.12em',
            textTransform:'uppercase', cursor:'pointer', transition:'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background='#0A9C8E')}
          onMouseLeave={e => (e.currentTarget.style.background='#087F73')}
        >
          View Well Intelligence
        </button>
      </div>
    </div>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface FieldMapProps {
  wells: WellPoint[];
  candidates?: CandidatePoint[];
  onWellClick?: (wellId: string) => void;
  onCandidateClick?: (candidateId: string) => void;
  candidateLocation?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
  selectedWellId?: string | null;
  selectedCandId?: string | null;
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
  selectedCandData?: any;
  visibleArrowCount?: number;
  selectionMode?: boolean;
  regionBounds?: [[number,number],[number,number]] | null;
}

// ── Main FieldMap ─────────────────────────────────────────────────────────────
export const FieldMap: React.FC<FieldMapProps> = ({
  wells, candidates, onWellClick, onCandidateClick,
  candidateLocation, onMapClick, selectedWellId,
  selectedCandId, flyToLocation, selectedCandData, visibleArrowCount = 0,
  selectionMode = false, regionBounds = null
}) => {
  const navigate = useNavigate();
  const [selWell, setSelWell] = useState<string|null>(selectedWellId||null);
  const [selCand, setSelCand] = useState<string|null>(selectedCandId||null);
  const [quickCardWell, setQuickCardWell] = useState<WellPoint|null>(null);

  useEffect(() => { setSelWell(selectedWellId||null); }, [selectedWellId]);
  useEffect(() => { setSelCand(selectedCandId||null); }, [selectedCandId]);

  // Log map stats in dev
  useEffect(() => {
    let valid = 0, invalid = 0;
    wells.forEach(w => isValidCoordinate(w.lat, w.lng) ? valid++ : invalid++);
    console.log(`[MAP] wells received = ${wells.length}`);
    console.log(`[MAP] valid wells = ${valid}`);
    const active = wells.filter(w => w.status === 'ACTIVE' && isValidCoordinate(w.lat, w.lng)).length;
    console.log(`[MAP] active wells rendered = ${active}`);
    if (invalid > 0) console.error(`[MAP] invalid wells = ${invalid}`);
  }, [wells]);

  // Field polygons — computed once from valid wells
  const fieldPolygons = useMemo(() => {
    const groups: Record<string, [number,number][]> = {};
    wells.forEach(w => {
      if (!isValidCoordinate(w.lat, w.lng)) return;
      if (!w.field_name) return;
      if (!groups[w.field_name]) groups[w.field_name] = [];
      groups[w.field_name].push([w.lat, w.lng]);
    });
    return Object.entries(groups).map(([name, pts]) => {
      const hull = convexHull(pts);
      const padded = hull.length >= 3 ? padHull(hull, 0.018) : hull;
      return { name, positions: padded, color: fieldColor(name) };
    });
  }, [wells]);

  const supportingSet = useMemo(() => {
    const map = new Map<string, { data: any, rank: number }>();
    if (selectedCandData?.supporting_wells) {
      selectedCandData.supporting_wells.slice(0, 5).forEach((sw: any, idx: number) => map.set(sw.well_id, { data: sw, rank: idx }));
    }
    return map;
  }, [selectedCandData]);

  const selCandObj = (candidates||[]).find(c => c.id === selCand);

  const handleWellClick = (well: WellPoint) => {
    setSelWell(well.id);
    const supp = supportingSet.get(well.id);
    setQuickCardWell({
      ...well,
      supportingEvidence: supp ? {
        distance: supp.data.distance_km,
        similarity: selectedCandData.historical_similarity,
        candLabel: selectedCandData.candidate_label
      } : undefined
    });
    if (onWellClick) onWellClick(well.id);
  };

  const handleCandClick = (candId: string) => {
    console.log(`[CANDIDATE MARKER CLICK] candidate=${candId}`);
    setSelCand(candId);
    setQuickCardWell(null);
    onCandidateClick?.(candId);
  };

  const handleViewFullWell = (wellId: string) => {
    setQuickCardWell(null);
    navigate(`/dashboard/wells/${wellId}`);
  };

  return (
    <div style={{ position:'relative', height:'100%', width:'100%', cursor: selectionMode ? 'crosshair' : 'default' }}>
      <MapContainer
        center={[22, 78]} zoom={5}
        style={{ height:'100%', width:'100%', background:'#0A0A0A', cursor: selectionMode ? 'crosshair' : '' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        <MapFitter wells={wells} />
        <BoundsController bounds={regionBounds} />
        <MapClickHandler onMapClick={onMapClick}/>
        {flyToLocation && <CameraController center={flyToLocation} zoom={flyToLocation.zoom}/>}

        {/* ── Field polygons ── */}
        {fieldPolygons.map(f => f.positions.length >= 3 && (
          <Polygon key={f.name} positions={f.positions}
            pathOptions={{ color:f.color, fillColor:f.color, fillOpacity:0.07, weight:1.2, opacity:0.38, dashArray:'5 4' }}>
            <Tooltip direction="center" permanent className="field-label-tooltip">
              <span style={{ color:f.color, fontWeight:'700', letterSpacing:'0.1em', fontSize:'9px', textTransform:'uppercase', textShadow:'0 1px 4px rgba(0,0,0,0.95)' }}>
                {f.name}
              </span>
            </Tooltip>
          </Polygon>
        ))}

        {/* ── Manual candidate location circle ── */}
        {candidateLocation && isValidCoordinate(candidateLocation.lat, candidateLocation.lng) && (
          <Circle center={[candidateLocation.lat, candidateLocation.lng]} radius={600}
            pathOptions={{ color:'#F59E0B', fillColor:'#F59E0B', fillOpacity:0.18, weight:2 }}/>
        )}

        {/* ── Evidence arrows (staggered by visibleArrowCount) ── */}
        {selCandObj?.supportingWells?.slice(0, Math.min(visibleArrowCount, 5)).map((sw, idx) => {
          if (!isValidCoordinate(selCandObj.lat, selCandObj.lng) || !isValidCoordinate(sw.lat, sw.lng)) {
            console.error(`[MAP INVALID COORDINATES] type=EvidenceArrow candidateId=${selCandObj.id} swLat=${sw.lat} swLng=${sw.lng}`);
            return null;
          }
          return (
            <Polyline
              key={`evidence-${selCand}-${idx}`}
              positions={[[sw.lat, sw.lng], [selCandObj.lat, selCandObj.lng]]}
              pathOptions={{ color:'#087F73', weight:1.8, opacity:0.65, dashArray:'5 8' }}
            />
          );
        })}

        {/* ── Candidate markers ── */}
        {(candidates||[]).map(c => {
          if (!isValidCoordinate(c.lat, c.lng)) {
            console.error(`[MAP INVALID COORDINATES] type=Candidate id=${c.id} latitude=${c.lat} longitude=${c.lng}`);
            return null;
          }
          return (
            <Marker key={c.id} position={[c.lat, c.lng]}
              icon={makeCandidateIcon(c.label, c.suitability, c.risk, selCand===c.id)}
              eventHandlers={{ click: () => handleCandClick(c.id) }}>
              <Tooltip direction="top" offset={[0,-16]} className="nwis-tooltip">
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', minWidth:'150px' }}>
                  <div style={{ fontWeight:'700', color:'#087F73', marginBottom:'4px' }}>CANDIDATE {c.label}</div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#A3A3A3' }}>Suitability</span>
                    <span style={{ color:'#F5F5F2', fontWeight:'600' }}>{c.suitability}/100</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#A3A3A3' }}>Risk</span>
                    <span style={{ fontWeight:'600', color:c.risk==='HIGH'?'#D94A4A':c.risk==='MEDIUM'?'#C78A2C':'#3E8F68' }}>{c.risk}</span>
                  </div>
                  <div style={{ marginTop:'5px', paddingTop:'4px', borderTop:'1px solid #2A2A2A', color:'#087F73', fontSize:'10px', textAlign:'center' }}>Click to select</div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* ── Well markers ── */}
        {wells.map(well => {
          if (!isValidCoordinate(well.lat, well.lng)) return null;
          const isInfluencing = supportingSet.has(well.id);
          const influencingRank = isInfluencing ? supportingSet.get(well.id)!.rank : null;
          const isPrimaryInfluencing = influencingRank === 0;
          const suppData = isInfluencing ? supportingSet.get(well.id)!.data : null;
          return (
            <Marker key={well.id} position={[well.lat, well.lng]}
              icon={makeWellIcon(well.status, well.risk, selWell===well.id, isInfluencing, influencingRank, !!selectedCandId)}
              eventHandlers={{ click: () => handleWellClick(well) }}>
              <Tooltip direction="top" offset={[0,-12]} className="nwis-tooltip">
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', lineHeight:'1.6', minWidth:'150px' }}>
                  {isInfluencing ? (
                    <>
                      <div style={{ fontWeight:'800', color: isPrimaryInfluencing ? '#13A89E' : '#087F73', marginBottom:'4px', letterSpacing:'0.05em' }}>
                        {isPrimaryInfluencing ? '★ PRIMARY INFLUENCING WELL' : '◆ SUPPORTING WELL'}
                      </div>
                      <div style={{ fontWeight:'700', color:'#F5F5F2', marginBottom:'6px' }}>{well.id}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:'12px' }}>
                        <span style={{ color:'#A3A3A3' }}>Distance</span>
                        <span style={{ color:'#F5F5F2' }}>{suppData.distance_km} km</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:'12px' }}>
                        <span style={{ color:'#A3A3A3' }}>Similarity</span>
                        <span style={{ color:'#13A89E', fontWeight:'700' }}>{selectedCandData?.historical_similarity}%</span>
                      </div>
                      <div style={{ marginTop:'6px', paddingTop:'6px', borderTop:'1px solid #2A2A2A', color:'#737373', fontSize:'10px' }}>
                        Click to view Well Intelligence
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight:'700', color:'#13A89E', marginBottom:'4px' }}>{well.id}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:'12px' }}>
                        <span style={{ color:'#A3A3A3' }}>Status</span>
                        <span style={{ color:well.status==='ACTIVE'?'#3E8F68':'#737373', fontWeight:'600' }}>{well.status}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:'12px' }}>
                        <span style={{ color:'#A3A3A3' }}>Depth</span>
                        <span style={{ color:'#F5F5F2' }}>{well.depth?`${Math.round(well.depth).toLocaleString()} m`:'—'}</span>
                      </div>
                      <div style={{ marginTop:'6px', paddingTop:'6px', borderTop:'1px solid #2A2A2A', color:'#737373', fontSize:'10px' }}>Click for details</div>
                    </>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── Well quick-card overlay ── */}
      {quickCardWell && (
        <WellQuickCard
          well={quickCardWell}
          onClose={() => setQuickCardWell(null)}
          onViewFull={handleViewFullWell}
        />
      )}

      {/* ── Legend ── */}
      <div style={{ position:'absolute', bottom:16, left:16, zIndex:400, background:'rgba(17,17,17,0.93)', backdropFilter:'blur(8px)', border:'1px solid #2A2A2A', borderRadius:6, padding:'10px 14px', fontSize:'10px', pointerEvents:'none', minWidth:142, boxShadow:'0 4px 12px rgba(0,0,0,0.5)' }}>
        <div style={{ fontWeight:'700', color:'#737373', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'8px', paddingBottom:'5px', borderBottom:'1px solid #2A2A2A' }}>Legend</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
          <LegendRow svg={D('#087F73','#13A89E','none')} label="Active Well"/>
          <LegendRow svg={O('#737373')} label="Historical Well"/>
          <LegendRow svg={D('#087F73','#13A89E','#D94A4A')} label="High Risk"/>
          <LegendRow svg={D('#087F73','#13A89E','#C78A2C')} label="Medium Risk"/>
          <div style={{ marginTop:'5px', paddingTop:'5px', borderTop:'1px solid #2A2A2A', display:'flex', alignItems:'center', gap:'7px' }}>
            <div style={{ width:16, height:10, background:'rgba(8,127,115,0.12)', border:'1px dashed rgba(8,127,115,0.45)', borderRadius:2, flexShrink:0 }}/>
            <span style={{ color:'#A3A3A3' }}>Field Area</span>
          </div>
          {supportingSet.size > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
              <span style={{ color:'#087F73', fontSize:10 }}>◆</span>
              <span style={{ color:'#087F73' }}>Evidence Well</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
