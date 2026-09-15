from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.database import get_db
from app.models.models import DrillingEvent, Well
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/search")
def search_historical(q: str = Query("", min_length=1), db: Session = Depends(get_db)):
    logger.info(f"[HISTORICAL] search request q={q}")
    wildcard_q = q.replace(" ", "%")
    search_term = f"%{wildcard_q}%"
    
    # We join DrillingEvent with Well to provide better context
    query = db.query(DrillingEvent, Well).outerjoin(Well, DrillingEvent.well_id == Well.well_id)
    
    # Filter across relevant fields
    query = query.filter(
        or_(
            DrillingEvent.event_type.ilike(search_term),
            DrillingEvent.description.ilike(search_term),
            DrillingEvent.root_cause.ilike(search_term),
            DrillingEvent.mitigation.ilike(search_term),
            DrillingEvent.formation.ilike(search_term)
        )
    )
    
    # Limit results
    events = query.limit(50).all()
    
    results = []
    for event, well in events:
        well_name = well.well_name if well else event.well_id
        depth_str = f"{event.event_depth}m" if event.event_depth else "Unknown Depth"
        results.append({
            "type": "EVENT",
            "well_id": event.well_id,
            "title": f"{event.event_type} at {well_name} ({depth_str})",
            "severity": event.severity or "MEDIUM",
            "summary": event.description or "",
            "root_cause": event.root_cause or "Unknown",
            "mitigation": event.mitigation or "None documented"
        })
        
    logger.info(f"[HISTORICAL] results={len(results)}")
    return {"results": results}
