from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Well, DrillingEvent

router = APIRouter()

def serialize_well(w: Well) -> dict:
    return {
        "well_id": w.well_id,
        "well_name": w.well_name,
        "field_name": w.field_name,
        "latitude": w.latitude,
        "longitude": w.longitude,
        "status": w.status,
        "current_depth": w.current_depth,
        "current_formation": w.current_formation,
        "spud_date": w.spud_date.isoformat() if w.spud_date else None,
        "completion_date": w.completion_date.isoformat() if w.completion_date else None,
        "total_depth": w.total_depth,
        "well_type": w.well_type
    }

@router.get("/")
def get_wells(db: Session = Depends(get_db)):
    wells = db.query(Well).all()
    return [serialize_well(w) for w in wells]

@router.get("/{well_id}")
def get_well(well_id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
    return serialize_well(well)

from sqlalchemy import func
from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_Distance

@router.get("/nearby")
def get_nearby_wells(lat: float, lng: float, radius_km: float = 5.0, db: Session = Depends(get_db)):
    # Create the point geometry (SRID 4326)
    # Cast to geography for accurate distance in meters regardless of coordinate system
    point = func.ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    point_geog = func.Geography(point)
    
    # Distance in meters
    radius_meters = radius_km * 1000.0

    # Query using PostGIS spatial functions
    # Using ST_DWithin for efficient bounding box + exact distance index search
    wells_query = (
        db.query(
            Well, 
            func.ST_Distance(func.Geography(Well.location), point_geog).label("distance_m")
        )
        .filter(ST_DWithin(func.Geography(Well.location), point_geog, radius_meters))
        .all()
    )

    results = []
    for well, distance_m in wells_query:
        # Load related events (optional, can be optimized with joinedload)
        events = db.query(DrillingEvent).filter(DrillingEvent.well_id == well.well_id).all()
        
        results.append({
            "well_id": well.well_id,
            "well_name": well.well_name,
            "latitude": well.latitude,
            "longitude": well.longitude,
            "distance": round(distance_m / 1000.0, 3), # Return in km
            "formation": well.current_formation,
            "depth": well.current_depth,
            "status": well.status,
            "relevant_events": [{"type": e.event_type, "severity": e.severity, "depth": e.event_depth} for e in events]
        })
        
    return results

@router.get("/{well_id}/events")
def get_well_events(well_id: str, db: Session = Depends(get_db)):
    events = db.query(DrillingEvent).filter(DrillingEvent.well_id == well_id).all()
    return events

from app.models.models import DrillingObservation, Anomaly

@router.get("/{well_id}/observations")
def get_well_observations(well_id: str, db: Session = Depends(get_db)):
    obs = db.query(DrillingObservation).filter(DrillingObservation.well_id == well_id).order_by(DrillingObservation.timestamp.desc()).limit(10).all()
    return obs

@router.get("/{well_id}/intelligence")
def get_well_intelligence(well_id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
        
    # Get any anomalies
    anomalies = db.query(Anomaly).filter(Anomaly.well_id == well_id).order_by(Anomaly.timestamp.desc()).limit(5).all()
    
    # Calculate mock risk intelligence based on historical
    risk = {
        "overall_risk": "LOW",
        "mud_loss_risk": "LOW",
        "stuck_pipe_risk": "LOW",
        "kick_risk": "LOW",
        "high_torque_risk": "LOW"
    }
    
    events = db.query(DrillingEvent).filter(DrillingEvent.well_id == well_id).all()
    for e in events:
        if e.severity in ["HIGH", "CRITICAL"]:
            risk["overall_risk"] = e.severity
        if "LOSS" in (e.event_type or ""): risk["mud_loss_risk"] = e.severity
        if "STUCK" in (e.event_type or ""): risk["stuck_pipe_risk"] = e.severity
        if "KICK" in (e.event_type or ""): risk["kick_risk"] = e.severity
        if "TORQUE" in (e.event_type or ""): risk["high_torque_risk"] = e.severity
        
    return {
        "well": serialize_well(well),
        "anomalies": anomalies,
        "risk_intelligence": risk
    }
