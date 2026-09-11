from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import DrillingEvent, Well

router = APIRouter()

@router.get("/{well_id}/recommendation")
def get_recommendation(well_id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
        
    # Get recent events for this well (or nearby) to form recommendation
    events = db.query(DrillingEvent).filter(DrillingEvent.well_id == well_id).all()
    
    # Deterministic Rule Engine
    if not events:
        # Default stable
        return {
            "primary_risk": "LOW RISK",
            "confidence": "HIGH",
            "why": "Current drilling parameters are stable and no high-severity historical events match this interval.",
            "recommended_actions": [
                "Continue drilling as per program.",
                "Maintain standard monitoring of torque and drag.",
                "Conduct routine sweeps as planned."
            ],
            "supporting_evidence": []
        }
        
    # Find most severe event
    event = sorted(events, key=lambda x: {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}.get(x.severity, 0), reverse=True)[0]
    
    risk_title = f"{event.event_type.replace('_', ' ')} RISK" if event.event_type else "DRILLING RISK"
    
    actions = []
    if "TORQUE" in risk_title:
        actions = [
            "Monitor torque and ROP closely.",
            "Maintain controlled WOB.",
            "Increase hole-cleaning attention.",
            "Review similar offset-well events before increasing drilling parameters."
        ]
    elif "LOSS" in risk_title:
        actions = [
            "Prepare LCM pills in reserve.",
            "Monitor trip tank closely.",
            "Control ECD to minimize formation breakdown."
        ]
    elif "STUCK" in risk_title:
        actions = [
            "Maintain pipe movement.",
            "Ensure adequate hole cleaning before connections.",
            "Limit stationary time."
        ]
    else:
        actions = [
            "Review historical events.",
            "Proceed with caution in current formation."
        ]

    return {
        "primary_risk": risk_title,
        "confidence": "HIGH" if event.severity in ["HIGH", "CRITICAL"] else "MEDIUM",
        "why": f"Similar {event.event_type} events occurred in this interval. Root cause historically was: {event.root_cause or 'Unknown'}",
        "recommended_actions": actions,
        "supporting_evidence": [
            f"Historical Mitigation: {event.mitigation or 'N/A'}",
            f"NPT Impact: {event.npt_hours or 0} hours"
        ]
    }
