from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.db.database import get_db
from app.models.models import DrillingEvent, Report, Well
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/search")
def search_global(q: str = Query("", min_length=1), db: Session = Depends(get_db)):
    logger.info(f"[GLOBAL SEARCH] query=\"{q}\"")
    wildcard_q = q.replace(" ", "%")
    search_term = f"%{wildcard_q}%"
    
    results = []

    try:
        # 1. Search Wells
        wells = db.query(Well).filter(
            or_(
                Well.well_id.ilike(search_term),
                Well.well_name.ilike(search_term)
            )
        ).limit(5).all()
        for w in wells:
            results.append({
                "type": "WELL",
                "id": w.well_id,
                "title": w.well_id,
                "subtitle": w.well_name,
                "match": w.field_name or "Unknown Field"
            })

        # 2. Search Regions / Fields
        # For this we distinct query the wells' field_name
        regions = db.query(Well.field_name).filter(
            Well.field_name.ilike(search_term)
        ).group_by(Well.field_name).limit(3).all()
        for r in regions:
            if r.field_name:
                results.append({
                    "type": "REGION",
                    "id": r.field_name,
                    "title": r.field_name,
                    "subtitle": "Region",
                    "match": "Field / Region"
                })

        # 3. Search Formations
        formations = db.query(DrillingEvent.formation).filter(
            DrillingEvent.formation.ilike(search_term)
        ).group_by(DrillingEvent.formation).limit(3).all()
        for f in formations:
            if f.formation:
                results.append({
                    "type": "FORMATION",
                    "id": f.formation,
                    "title": f.formation,
                    "subtitle": "Formation Context",
                    "match": "Geological Formation"
                })

        # 4. Search Events
        events = db.query(DrillingEvent).filter(
            or_(
                DrillingEvent.event_type.ilike(search_term),
                DrillingEvent.description.ilike(search_term),
                DrillingEvent.root_cause.ilike(search_term)
            )
        ).limit(5).all()
        for e in events:
            results.append({
                "type": "EVENT",
                "id": str(e.id),
                "title": e.event_type,
                "subtitle": f"{e.event_depth}m - {e.well_id}",
                "match": (e.description[:50] + '...') if e.description else "Historical Event"
            })

        # 5. Search Reports
        reports = db.query(Report).filter(
            or_(
                Report.title.ilike(search_term),
                Report.report_type.ilike(search_term),
                Report.extracted_text.ilike(search_term)
            )
        ).limit(5).all()
        for rp in reports:
            results.append({
                "type": "REPORT",
                "id": str(rp.id),
                "title": rp.title,
                "subtitle": rp.report_type,
                "match": (rp.extracted_text[:50] + '...') if rp.extracted_text else "Document"
            })

        logger.info(f"[GLOBAL SEARCH] results={len(results)}")
        return {"results": results}

    except Exception as e:
        logger.error(f"[GLOBAL SEARCH ERROR] status=500 message={str(e)}")
        return {"results": [], "error": "Unable to search NWIS intelligence."}
