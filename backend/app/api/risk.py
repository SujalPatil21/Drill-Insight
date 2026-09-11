from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.db.database import get_db
from app.models.models import Well, DrillingEvent, Anomaly
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# POST /predict — existing mock prediction endpoint
# ---------------------------------------------------------------------------
from pydantic import BaseModel
from typing import Dict, Any

class RiskPredictionRequest(BaseModel):
    well_id: str
    current_depth: float
    formation: str
    current_state: Dict[str, Any]
    recent_observations: list
    historical_context: list

@router.post("/predict")
def predict_risk(request: RiskPredictionRequest):
    return {
        "well_id": request.well_id,
        "prediction_depth": request.current_depth,
        "overall_risk_level": "MEDIUM",
        "risks": {
            "stuck_pipe": {"probability": 0.18, "risk_level": "LOW"},
            "kick": {"probability": 0.07, "risk_level": "LOW"},
            "mud_loss": {"probability": 0.62, "risk_level": "HIGH"},
            "high_torque": {"probability": 0.41, "risk_level": "MEDIUM"}
        },
        "top_contributing_features": [
            {"feature": "Recent trend", "impact": 0.42, "direction": "increases_risk"},
            {"feature": "Formation-relative deviation", "impact": 0.21, "direction": "increases_risk"}
        ],
        "model_version": "demo-v1"
    }


# ---------------------------------------------------------------------------
# GET /overview — field-wide risk aggregation from real DB
# ---------------------------------------------------------------------------
@router.get("/overview")
def get_risk_overview(db: Session = Depends(get_db)):
    logger.info("[RISK API] GET /api/risk/overview")

    all_wells = db.query(Well).all()
    total_wells = len(all_wells)

    # Derive demo risk by hashing well_id deterministically (no ML model)
    def demo_risk(well_id: str) -> str:
        h = sum(ord(c) for c in well_id) % 10
        if h < 2: return "HIGH"
        if h < 5: return "MEDIUM"
        return "LOW"

    high_wells = [w for w in all_wells if demo_risk(w.well_id) == "HIGH"]
    medium_wells = [w for w in all_wells if demo_risk(w.well_id) == "MEDIUM"]
    low_wells = [w for w in all_wells if demo_risk(w.well_id) == "LOW"]

    # Risk categories based on real event data
    mud_loss = db.query(DrillingEvent).filter(DrillingEvent.event_type.ilike("%MUD%LOSS%")).count()
    stuck_pipe = db.query(DrillingEvent).filter(DrillingEvent.event_type.ilike("%STUCK%")).count()
    kick = db.query(DrillingEvent).filter(DrillingEvent.event_type.ilike("%KICK%")).count()
    high_torque = db.query(DrillingEvent).filter(DrillingEvent.event_type.ilike("%TORQUE%")).count()

    # Get anomaly counts
    anomaly_count = db.query(Anomaly).count()

    logger.info(f"[RISK API] status=200 high={len(high_wells)} medium={len(medium_wells)} low={len(low_wells)}")

    return {
        "demo_mode": True,
        "intelligence_basis": "Historical analogy + deterministic demo scoring",
        "summary": {
            "total_wells": total_wells,
            "high_risk": len(high_wells),
            "medium_risk": len(medium_wells),
            "low_risk": len(low_wells),
            "anomalies_detected": anomaly_count,
        },
        # Backwards compat keys for existing RiskIntelligence.tsx
        "risk_summary": {
            "high": len(high_wells),
            "medium": len(medium_wells),
            "low": len(low_wells),
        },
        "risk_distribution": [
            {"risk_level": "HIGH", "count": len(high_wells), "color": "#D94A4A"},
            {"risk_level": "MEDIUM", "count": len(medium_wells), "color": "#C78A2C"},
            {"risk_level": "LOW", "count": len(low_wells), "color": "#3E8F68"},
        ],
        "high_risk_wells": [
            {
                "well_id": w.well_id,
                "well_name": w.well_name,
                "field_name": w.field_name,
                "status": w.status,
                "current_depth": w.current_depth,
                "current_formation": w.current_formation,
                "risk_level": "HIGH",
            }
            for w in high_wells[:10]
        ],
        "medium_risk_wells": [
            {
                "well_id": w.well_id,
                "well_name": w.well_name,
                "field_name": w.field_name,
                "status": w.status,
                "current_depth": w.current_depth,
                "current_formation": w.current_formation,
                "risk_level": "MEDIUM",
            }
            for w in medium_wells[:10]
        ],
        "risk_categories": [
            {"name": "Mud Loss", "event_count": mud_loss, "risk_level": "HIGH" if mud_loss > 50 else "MEDIUM"},
            {"name": "Stuck Pipe", "event_count": stuck_pipe, "risk_level": "HIGH" if stuck_pipe > 30 else "MEDIUM"},
            {"name": "Kick", "event_count": kick, "risk_level": "MEDIUM"},
            {"name": "High Torque", "event_count": high_torque, "risk_level": "MEDIUM" if high_torque > 20 else "LOW"},
        ],
    }
