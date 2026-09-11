"""
NWIS Candidate Generation & Evaluation Engine
==============================================
Deterministic decision-support engine for next-well candidate recommendation.
All scores are calculated from real PostgreSQL data, not a trained ML model.
"""

import math
import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Geometry helpers (no shapely dependency)
# ---------------------------------------------------------------------------

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance between two points in km."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def field_centroid(wells: list) -> Tuple[float, float]:
    lats = [w.latitude for w in wells if w.latitude]
    lngs = [w.longitude for w in wells if w.longitude]
    return (sum(lats) / len(lats), sum(lngs) / len(lngs)) if lats else (27.5, 95.0)


def field_bbox(wells: list) -> Tuple[float, float, float, float]:
    """Returns (min_lat, min_lng, max_lat, max_lng)"""
    lats = [w.latitude for w in wells if w.latitude]
    lngs = [w.longitude for w in wells if w.longitude]
    return min(lats), min(lngs), max(lats), max(lngs)


def point_in_padded_bbox(lat: float, lng: float,
                          min_lat: float, min_lng: float,
                          max_lat: float, max_lng: float,
                          pad: float = 0.02) -> bool:
    return (min_lat - pad) <= lat <= (max_lat + pad) and \
           (min_lng - pad) <= lng <= (max_lng + pad)


# ---------------------------------------------------------------------------
# Suitability scoring weights
# ---------------------------------------------------------------------------
WEIGHTS = {
    "geological_suitability": 0.30,
    "reservoir_quality":      0.25,
    "formation_continuity":   0.15,
    "historical_risk_inv":    0.15,   # inverted — lower risk → higher score
    "offset_evidence":        0.10,
    "spatial_confidence":     0.05,
}


def clamp(v: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, v))


def score_spatial_confidence(nearby_count: int) -> float:
    """More nearby wells → higher spatial confidence."""
    return clamp(min(nearby_count * 12, 100))


def score_offset_evidence(event_count: int, nearby_count: int) -> float:
    if nearby_count == 0:
        return 40.0
    ratio = event_count / nearby_count
    return clamp(100 - ratio * 8)


def score_historical_risk(mud: int, stuck: int, kick: int, torque: int, total_events: int) -> float:
    """Returns a RISK score 0–100. Higher = riskier. We invert for suitability."""
    if total_events == 0:
        return 50.0
    risk_events = mud + stuck + kick + torque
    ratio = risk_events / max(total_events, 1)
    return clamp(ratio * 100)


def score_geological_suitability(nearby_count: int, field_well_count: int) -> float:
    density_bonus = clamp(nearby_count * 8)
    field_bonus = clamp(field_well_count * 4)
    return clamp((density_bonus + field_bonus) / 2 + 30)


def score_reservoir_quality(nearby_count: int) -> float:
    return clamp(50 + nearby_count * 5)


def score_formation_continuity(event_types: set) -> float:
    continuity = 90 - len(event_types) * 5
    return clamp(continuity)


def compute_overall_suitability(components: Dict[str, float]) -> float:
    geo = components["geological_suitability"]
    res = components["reservoir_quality"]
    cont = components["formation_continuity"]
    risk_inv = 100 - components.get("historical_risk_score", 50)
    offset = components["offset_evidence"]
    spatial = components["spatial_confidence"]

    score = (
        geo   * WEIGHTS["geological_suitability"] +
        res   * WEIGHTS["reservoir_quality"] +
        cont  * WEIGHTS["formation_continuity"] +
        risk_inv * WEIGHTS["historical_risk_inv"] +
        offset * WEIGHTS["offset_evidence"] +
        spatial * WEIGHTS["spatial_confidence"]
    )
    return round(clamp(score), 1)


def drilling_risk_level(mud: int, stuck: int, kick: int, torque: int) -> str:
    total_incidents = mud + stuck + kick + torque
    if total_incidents > 60:
        return "HIGH"
    elif total_incidents > 25:
        return "MEDIUM"
    elif total_incidents > 8:
        return "LOW"
    return "LOW"


def recommendation_decision(suitability: float, risk: str) -> str:
    if suitability >= 80 and risk in ("LOW", "MEDIUM"):
        return "PROCEED TO ENGINEERING REVIEW"
    elif suitability >= 80 and risk == "HIGH":
        return "HIGH POTENTIAL — REVIEW DRILLING RISK"
    elif suitability >= 65:
        return "FURTHER REVIEW RECOMMENDED"
    return "NOT RECOMMENDED"


def build_explanation(components: Dict[str, float],
                      nearby_wells: list,
                      mud: int, stuck: int, kick: int, torque: int,
                      nearby_count: int) -> Dict[str, Any]:
    positives = []
    concerns = []

    if components["geological_suitability"] >= 75:
        positives.append(f"Strong geological suitability from {nearby_count} nearby wells.")
    if components["reservoir_quality"] >= 70:
        positives.append("Reservoir quality supported by offset well data.")
    if components["formation_continuity"] >= 80:
        positives.append("High formation continuity across offset wells.")

    if mud > 20:
        concerns.append(f"{mud} nearby mud-loss events — monitor ECD carefully.")
    if stuck > 15:
        concerns.append(f"{stuck} stuck-pipe incidents in offset wells — maintain hole cleaning.")
    if torque > 20:
        concerns.append(f"{torque} high-torque events in offset wells — control WOB.")
    if kick > 10:
        concerns.append(f"{kick} kick events in offset wells — review pore-pressure prognosis.")

    if not positives:
        positives.append("Limited offset-well coverage — exercise caution.")
    if not concerns:
        concerns.append("No significant drilling incidents in nearby offset wells.")

    return {"positives": positives, "concerns": concerns}


# ---------------------------------------------------------------------------
# Candidate grid generator
# ---------------------------------------------------------------------------

def generate_candidate_grid(
    field_wells: list,
    all_wells: list,
    min_separation_km: float = 1.5,
    grid_step_deg: float = 0.04,
) -> List[Dict[str, float]]:
    """Generate grid of candidate locations within a field bounding box."""

    if not field_wells:
        return []

    min_lat, min_lng, max_lat, max_lng = field_bbox(field_wells)

    candidates = []
    lat = min_lat
    idx = 0
    while lat <= max_lat + grid_step_deg:
        lng = min_lng
        while lng <= max_lng + grid_step_deg:
            if not point_in_padded_bbox(lat, lng, min_lat, min_lng, max_lat, max_lng, pad=0.005):
                lng += grid_step_deg
                continue

            # Exclude if too close to any existing well
            too_close = any(
                haversine_km(lat, lng, w.latitude, w.longitude) < min_separation_km
                for w in all_wells if w.latitude and w.longitude
            )
            if not too_close:
                candidates.append({"lat": lat, "lng": lng, "grid_idx": idx})
                idx += 1

            lng += grid_step_deg
        lat += grid_step_deg

    logger.info(f"[CANDIDATE ENGINE] Generated grid: {idx} points after filtering")
    return candidates
