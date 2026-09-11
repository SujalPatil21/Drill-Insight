from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Well, Formation, DrillingObservation, DrillingEvent, Anomaly, Report, CandidateEvaluation

router = APIRouter()

@router.get("/data-summary")
def get_data_summary(db: Session = Depends(get_db)):
    return {
        "database": "NWIS",
        "wells": db.query(Well).count(),
        "active_wells": db.query(Well).filter(Well.status == "ACTIVE").count(),
        "historical_wells": db.query(Well).filter(Well.status == "Historical").count(),
        "formations": db.query(Formation).count(),
        "observations": db.query(DrillingObservation).count(),
        "events": db.query(DrillingEvent).count(),
        "anomalies": db.query(Anomaly).count(),
        "reports": db.query(Report).count(),
        "candidates": db.query(CandidateEvaluation).count()
    }
