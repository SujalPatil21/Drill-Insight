from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.models import Well, DrillingObservation, DrillingEvent

router = APIRouter()

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    total_wells = db.query(Well).count()
    active_wells = db.query(Well).filter(Well.status == "ACTIVE").count()
    
    # Calculate high risk (mock logic: wells with critical/high severity recent events or high deviation anomalies)
    # Since risk isn't fully calculated on the well model yet, we'll proxy it via demo fields in events
    high_risk_wells = db.query(Well).filter(Well.status == "ACTIVE").count() // 3 # Placeholder derived
    
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_events = db.query(DrillingEvent).filter(DrillingEvent.timestamp >= thirty_days_ago).count()
    
    anomalies_count = 0 # Placeholder if no anomalies table is heavily populated
    
    return {
        "total_wells": total_wells,
        "high_risk_wells": high_risk_wells,
        "recent_events": recent_events,
        "active_wells": active_wells,
        "anomalies": anomalies_count,
        "demo_mode": "ON"
    }

@router.get("/risk/overview")
def get_risk_overview(db: Session = Depends(get_db)):
    active_wells = db.query(Well).filter(Well.status == "ACTIVE").all()
    
    high = [w for w in active_wells if len(w.well_id) % 3 == 0]
    medium = [w for w in active_wells if len(w.well_id) % 3 == 1]
    low = [w for w in active_wells if len(w.well_id) % 3 == 2]
    
    return {
        "risk_summary": {
            "high": len(high),
            "medium": len(medium),
            "low": len(low)
        },
        "high_risk_wells": [{"well_id": w.well_id, "well_name": w.well_name} for w in high[:5]],
        "medium_risk_wells": [{"well_id": w.well_id, "well_name": w.well_name} for w in medium[:5]],
        "low_risk_wells": [{"well_id": w.well_id, "well_name": w.well_name} for w in low[:5]]
    }
