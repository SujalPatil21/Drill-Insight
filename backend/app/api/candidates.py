from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.db.database import get_db
from app.models.models import Well, DrillingEvent, Anomaly
from app.services.candidate_engine import (
    haversine_km, generate_candidate_grid, field_centroid,
    score_geological_suitability, score_reservoir_quality,
    score_formation_continuity, score_historical_risk,
    score_spatial_confidence, score_offset_evidence,
    compute_overall_suitability, drilling_risk_level,
    recommendation_decision, build_explanation, clamp
)
import logging, hashlib

logger = logging.getLogger(__name__)
router = APIRouter()

NEARBY_RADIUS_KM = 8.0

def _evaluate_at(lat: float, lng: float, db: Session, candidate_id: str = None):
    all_wells = db.query(Well).filter(Well.latitude != None, Well.longitude != None).all()

    nearby = [w for w in all_wells if haversine_km(lat, lng, w.latitude, w.longitude) <= NEARBY_RADIUS_KM]
    nearby_count = len(nearby)

    if nearby_count == 0:
        return None  # no evidence

    nearest = min(nearby, key=lambda w: haversine_km(lat, lng, w.latitude, w.longitude))
    nearest_dist = round(haversine_km(lat, lng, nearest.latitude, nearest.longitude), 2)

    nearby_ids = [w.well_id for w in nearby]

    events = db.query(DrillingEvent).filter(DrillingEvent.well_id.in_(nearby_ids)).all()
    total_events = len(events)

    mud  = sum(1 for e in events if "MUD" in (e.event_type or "").upper() and "LOSS" in (e.event_type or "").upper())
    stuck = sum(1 for e in events if "STUCK" in (e.event_type or "").upper())
    kick  = sum(1 for e in events if "KICK"  in (e.event_type or "").upper())
    torque = sum(1 for e in events if "TORQUE" in (e.event_type or "").upper())

    event_types = {e.event_type for e in events if e.event_type}
    field_name = nearby[0].field_name if nearby else "Unknown"
    field_wells = [w for w in all_wells if w.field_name == field_name]

    geo  = score_geological_suitability(nearby_count, len(field_wells))
    res  = score_reservoir_quality(nearby_count)
    cont = score_formation_continuity(event_types)
    hist = score_historical_risk(mud, stuck, kick, torque, total_events)
    off  = score_offset_evidence(total_events, nearby_count)
    spa  = score_spatial_confidence(nearby_count)

    components = {
        "geological_suitability": round(geo, 1),
        "reservoir_quality":      round(res, 1),
        "formation_continuity":   round(cont, 1),
        "historical_risk_score":  round(hist, 1),
        "offset_evidence":        round(off, 1),
        "spatial_confidence":     round(spa, 1),
    }

    overall = compute_overall_suitability(components)
    risk    = drilling_risk_level(mud, stuck, kick, torque)
    decision = recommendation_decision(overall, risk)
    explanation = build_explanation(components, nearby, mud, stuck, kick, torque, nearby_count)

    # Similarity: composite of offset evidence + geological match (0-100)
    similarity = round(clamp((geo * 0.5 + cont * 0.3 + off * 0.2)), 1)

    supporting_wells = sorted(nearby, key=lambda w: haversine_km(lat, lng, w.latitude, w.longitude))[:5]

    return {
        "candidate_id": candidate_id or f"C-{abs(hash((round(lat,4), round(lng,4)))) % 100000}",
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "field_name": field_name,
        "overall_suitability": overall,
        "suitability_label": "HIGH" if overall >= 80 else "MODERATE" if overall >= 65 else "LOW",
        "geological_suitability": components["geological_suitability"],
        "reservoir_quality": components["reservoir_quality"],
        "formation_continuity": components["formation_continuity"],
        "historical_risk_score": components["historical_risk_score"],
        "offset_evidence": components["offset_evidence"],
        "spatial_confidence": components["spatial_confidence"],
        "drilling_risk": {
            "level": risk,
            "mud_loss_events": mud,
            "stuck_pipe_events": stuck,
            "kick_events": kick,
            "high_torque_events": torque,
        },
        "nearby_wells_count": nearby_count,
        "nearest_well": nearest.well_id,
        "nearest_distance_km": nearest_dist,
        "historical_similarity": similarity,
        "recommendation": decision,
        "explanation": explanation,
        "supporting_wells": [
            {
                "well_id": w.well_id,
                "well_name": w.well_name,
                "distance_km": round(haversine_km(lat, lng, w.latitude, w.longitude), 2),
                "status": w.status,
                "current_formation": w.current_formation,
                "latitude": w.latitude,
                "longitude": w.longitude,
            }
            for w in supporting_wells
        ],
        "disclaimer": "Decision support only. Final drilling decision remains with the engineer.",
    }


# ---------------------------------------------------------------------------
# POST /evaluate  — engineer-selected candidate
# ---------------------------------------------------------------------------
class CandidateRequest(BaseModel):
    candidate_id: str
    latitude: float
    longitude: float


@router.post("/evaluate")
def evaluate_candidate(request: CandidateRequest, db: Session = Depends(get_db)):
    logger.info(f"[CANDIDATE EVALUATION] lat={request.latitude} lng={request.longitude}")
    result = _evaluate_at(request.latitude, request.longitude, db, request.candidate_id)
    if result is None:
        return {
            "candidate_id": request.candidate_id,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "overall_suitability": 0,
            "suitability_label": "INSUFFICIENT DATA",
            "recommendation": "Insufficient offset-well data within 8 km.",
            "disclaimer": "Decision support only.",
        }
    logger.info(f"[CANDIDATE EVALUATION] suitability={result['overall_suitability']} risk={result['drilling_risk']['level']}")
    return result





# ---------------------------------------------------------------------------
# GET /recommended?field_name=...  — field-aware diverse top-3 candidates
# ---------------------------------------------------------------------------
@router.get("/recommended")
def get_recommended_candidates(field_name: str = None, db: Session = Depends(get_db)):
    logger.info(f"[CANDIDATE ENGINE] Starting field-aware recommendation. filter={field_name or 'ALL'}")

    all_wells = db.query(Well).filter(Well.latitude != None, Well.longitude != None).all()

    from collections import defaultdict
    field_groups: dict = defaultdict(list)
    for w in all_wells:
        if w.field_name:
            field_groups[w.field_name].append(w)

    if field_name:
        field_groups = {field_name: field_groups.get(field_name, [])}

    logger.info(f"[CANDIDATE ENGINE] Fields discovered: {list(field_groups.keys())}")

    all_scored = []

    for fn, fwells in field_groups.items():
        if len(fwells) < 3:
            logger.info(f"[CANDIDATE ENGINE] Skipping {fn}: only {len(fwells)} wells")
            continue

        grid = generate_candidate_grid(fwells, all_wells, min_separation_km=1.5, grid_step_deg=0.04)
        logger.info(f"[CANDIDATE ENGINE] {fn}: {len(grid)} grid candidates")

        if not grid:
            continue

        scored = []
        for pt in grid[:30]:
            result = _evaluate_at(pt["lat"], pt["lng"], db)
            if result and result["nearby_wells_count"] >= 2:
                result["field_name"] = fn
                scored.append(result)

        if scored:
            scored.sort(key=lambda x: x["overall_suitability"], reverse=True)
            logger.info(f"[CANDIDATE ENGINE] {fn}: best={scored[0]['overall_suitability']}")
            all_scored.extend(scored)

    if not all_scored:
        return {"candidates": [], "message": "No valid candidate locations found across any field."}

    all_scored.sort(key=lambda x: x["overall_suitability"], reverse=True)

    selected = []
    seen_fields = set()

    for cand in all_scored:
        if len(selected) >= 3:
            break
            
        is_duplicate = any(abs(c["latitude"] - cand["latitude"]) < 0.001 and abs(c["longitude"] - cand["longitude"]) < 0.001 for c in selected)
        if is_duplicate:
            continue

        if cand["field_name"] not in seen_fields:
            selected.append(cand)
            seen_fields.add(cand["field_name"])
        else:
            best_unseen_score = max([c["overall_suitability"] for c in all_scored if c["field_name"] not in seen_fields], default=0)
            if cand["overall_suitability"] >= best_unseen_score + 3.0:
                selected.append(cand)

    for cand in all_scored:
        if len(selected) >= 3:
            break
        is_duplicate = any(abs(c["latitude"] - cand["latitude"]) < 0.001 and abs(c["longitude"] - cand["longitude"]) < 0.001 for c in selected)
        if not is_duplicate and cand not in selected:
            selected.append(cand)

    selected.sort(key=lambda x: x["overall_suitability"], reverse=True)

    for i, c in enumerate(selected):
        c["candidate_label"] = ["A", "B", "C"][i] if i < 3 else str(i + 1)

    logger.info(f"[CANDIDATE ENGINE] Final diverse recommendations: {len(selected)}")
    for c in selected:
        logger.info(f"  [{c['candidate_label']}] {c['field_name']} suitability={c['overall_suitability']} risk={c['drilling_risk']['level']}")

    return {"candidates": selected}


# ---------------------------------------------------------------------------
# GET /{candidate_id}  — placeholder for stored candidate
# ---------------------------------------------------------------------------
@router.get("/{candidate_id}")
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=404, detail="Stored candidates not yet implemented. Use /recommended or /evaluate.")
