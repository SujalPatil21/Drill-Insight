import sys
import os
import pandas as pd
from datetime import datetime
import json
import math

# Add backend directory to sys path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.models import Base, Well, DrillingObservation, DrillingEvent, Formation, Report, Anomaly, CandidateEvaluation
from geoalchemy2.elements import WKTElement

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def clean_val(val):
    if pd.isna(val) or val == "NULL":
        return None
    return val

def normalize_well_id(hist_id, well_name):
    """
    Normalizes a historical well ID to match the master well ID format.
    Example: 'AN-001' with well_name 'Assam-01' -> 'NWIS-ASM-001'
    """
    if str(hist_id).startswith("NWIS-"):
        return hist_id
    
    # Simple deterministic mapping based on well_name prefixes if available
    # Actually, we can use the nwis_synthetic_master.csv to build a well_name -> well_id mapping
    return None # We will use a lookup dict built from master data

def ingest_master(db: Session, master_df: pd.DataFrame):
    print("Ingesting master data...")
    # Dictionary to keep track of added wells to prevent duplicates
    well_dict = {}
    
    for idx, row in master_df.iterrows():
        well_id = row['well_id']
        
        # 1. Create Well if not exists
        if well_id not in well_dict:
            well = db.query(Well).filter(Well.well_id == well_id).first()
            if not well:
                lat = clean_val(row['latitude'])
                lng = clean_val(row['longitude'])
                point = None
                if lat is not None and lng is not None:
                    point = WKTElement(f'POINT({lng} {lat})', srid=4326)
                
                well = Well(
                    well_id=well_id,
                    well_name=row['well_name'],
                    field_name=row['field_name'],
                    latitude=lat,
                    longitude=lng,
                    location=point,
                    status=row['well_status'],
                    well_type=row['well_type'],
                    total_depth=clean_val(row['total_depth_m']),
                    current_depth=clean_val(row['current_depth_m']),
                    current_formation=clean_val(row['formation'])
                )
                db.add(well)
                db.commit()
                db.refresh(well)
            well_dict[well_id] = well
            
        # 2. Add Drilling Observation
        obs_time = clean_val(row['timestamp'])
        if obs_time:
            # Parse datetime safely
            try:
                dt = pd.to_datetime(obs_time).to_pydatetime()
            except:
                dt = datetime.now()
                
            obs = DrillingObservation(
                well_id=well_id,
                timestamp=dt,
                measured_depth=clean_val(row['measured_depth_m']),
                formation=clean_val(row['formation']),
                parameters={
                    "rop": clean_val(row['rop_m_per_hr']),
                    "wob": clean_val(row['wob_klbf']),
                    "rpm": clean_val(row['rpm']),
                    "torque": clean_val(row['torque_knm']),
                    "mud_weight": clean_val(row['mud_weight_sg']),
                    "flow_rate": clean_val(row['flow_rate_lpm']),
                    "standpipe_pressure": clean_val(row['standpipe_pressure_psi']),
                    "hookload": clean_val(row['hookload_klbf']),
                }
            )
            db.add(obs)
            
        # 3. Add Anomaly if flag is true
        if clean_val(row.get('anomaly_flag_demo')) == True:
            anomaly = Anomaly(
                well_id=well_id,
                timestamp=dt,
                measured_depth=clean_val(row['measured_depth_m']),
                parameter=clean_val(row['anomaly_parameter']),
                observed_value=clean_val(row['observed_value']),
                expected_value=str(clean_val(row['expected_value'])),
                deviation=clean_val(row['deviation_percent']),
                anomaly_score=clean_val(row['anomaly_score_demo']),
                severity=clean_val(row['anomaly_severity_demo'])
            )
            db.add(anomaly)
            
        # 4. Add Candidate Evaluation if exists
        cand_id = clean_val(row.get('candidate_id'))
        if cand_id:
            cand = db.query(CandidateEvaluation).filter(CandidateEvaluation.candidate_id == cand_id).first()
            if not cand:
                lat = clean_val(row['candidate_latitude'])
                lng = clean_val(row['candidate_longitude'])
                point = None
                if lat is not None and lng is not None:
                    point = WKTElement(f'POINT({lng} {lat})', srid=4326)
                    
                cand = CandidateEvaluation(
                    candidate_id=cand_id,
                    latitude=lat,
                    longitude=lng,
                    location=point,
                    overall_suitability=clean_val(row['candidate_overall_suitability']),
                    prospectivity=clean_val(row['candidate_prospectivity']),
                    geological_suitability=clean_val(row['candidate_geological_suitability']),
                    drilling_risk_level=clean_val(row['candidate_drilling_risk_level']),
                    result={"reason": clean_val(row['candidate_reason'])}
                )
                db.add(cand)

    db.commit()
    print("Master data ingested.")
    return well_dict

def ingest_historical(db: Session, hist_df: pd.DataFrame, well_dict: dict):
    print("Ingesting historical intelligence...")
    
    # Create name to ID lookup
    name_to_id = {w.well_name: w.well_id for w in well_dict.values()}
    
    for idx, row in hist_df.iterrows():
        # Match well ID using well_name mapping
        hist_well_name = clean_val(row['well_name'])
        mapped_id = name_to_id.get(hist_well_name)
        
        # If well doesn't exist in master, create it as a historical well
        if not mapped_id:
            # Fallback, just create a new historical well record
            hist_id = clean_val(row['well_id'])
            # if we have no well id either, skip
            if not hist_id: continue
            mapped_id = f"NWIS-HIST-{hist_id}" # Normalize
            
            lat = clean_val(row['latitude'])
            lng = clean_val(row['longitude'])
            point = None
            if lat is not None and lng is not None:
                point = WKTElement(f'POINT({lng} {lat})', srid=4326)
                
            new_well = Well(
                well_id=mapped_id,
                well_name=hist_well_name or f"Hist Well {hist_id}",
                field_name=clean_val(row['field_name']),
                latitude=lat,
                longitude=lng,
                location=point,
                status="Historical",
                well_type=clean_val(row.get('well_type', 'Historical')),
            )
            db.add(new_well)
            db.commit()
            db.refresh(new_well)
            
            # Update lookups
            well_dict[mapped_id] = new_well
            name_to_id[hist_well_name] = mapped_id

        # Add Event
        event_type = clean_val(row.get('event_type'))
        if event_type:
            event = DrillingEvent(
                well_id=mapped_id,
                event_type=event_type,
                event_depth=clean_val(row.get('event_start_depth_m')) or clean_val(row.get('measured_depth_m')),
                start_depth=clean_val(row.get('event_start_depth_m')),
                end_depth=clean_val(row.get('event_end_depth_m')),
                severity=clean_val(row.get('event_severity')),
                description=clean_val(row.get('event_description')),
                root_cause=clean_val(row.get('root_cause')),
                mitigation=clean_val(row.get('mitigation')),
                npt_hours=clean_val(row.get('npt_hours')),
                formation=clean_val(row.get('formation'))
            )
            db.add(event)
            
        # Add Report
        report_id = clean_val(row.get('report_id'))
        if report_id:
            # check if report exists to avoid duplication
            rep = db.query(Report).filter(Report.title == clean_val(row.get('report_title'))).first()
            if not rep:
                rep_date = clean_val(row.get('report_date'))
                if rep_date:
                    try:
                        dt = pd.to_datetime(rep_date).to_pydatetime()
                    except:
                        dt = None
                else:
                    dt = None
                    
                rep = Report(
                    well_id=mapped_id,
                    title=clean_val(row.get('report_title')),
                    report_type=clean_val(row.get('report_type')),
                    report_date=dt,
                    extracted_text=clean_val(row.get('report_excerpt')),
                    metadata_info={
                        "source": clean_val(row.get('source_reference')),
                        "author": clean_val(row.get('author'))
                    }
                )
                db.add(rep)

        # Add Formation (unique by name and field)
        form_name = clean_val(row.get('formation'))
        if form_name:
            f_name = clean_val(row.get('field_name'))
            form = db.query(Formation).filter(Formation.formation_name == form_name, Formation.field_name == f_name).first()
            if not form:
                form = Formation(
                    formation_name=form_name,
                    field_name=f_name,
                    top_depth=clean_val(row.get('formation_top_depth_m')),
                    base_depth=clean_val(row.get('formation_base_depth_m')),
                    description=f"{form_name} in {f_name}"
                )
                db.add(form)
                
    db.commit()
    print("Historical data ingested.")


if __name__ == "__main__":
    master_csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/nwis_synthetic_master.csv'))
    hist_csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/nwis_historical_intelligence.csv'))
    
    print(f"Reading master CSV: {master_csv_path}")
    master_df = pd.read_csv(master_csv_path)
    print(f"Reading historical CSV: {hist_csv_path}")
    hist_df = pd.read_csv(hist_csv_path)

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Clear existing data for fresh ingestion (optional but good for MVP)
        print("Clearing old data...")
        db.query(CandidateEvaluation).delete()
        db.query(Anomaly).delete()
        db.query(DrillingObservation).delete()
        db.query(DrillingEvent).delete()
        db.query(Report).delete()
        db.query(Formation).delete()
        db.query(Well).delete()
        db.commit()

        well_dict = ingest_master(db, master_df)
        ingest_historical(db, hist_df, well_dict)
        
        print("Data ingestion complete!")
        
        # Verify
        print(f"Total Wells: {db.query(Well).count()}")
        print(f"Active Wells: {db.query(Well).filter(Well.status == 'ACTIVE').count()}")
        print(f"Historical Wells: {db.query(Well).filter(Well.status == 'Historical').count()}")
        print(f"Drilling Observations: {db.query(DrillingObservation).count()}")
        print(f"Drilling Events: {db.query(DrillingEvent).count()}")
        print(f"Anomalies: {db.query(Anomaly).count()}")
        print(f"Reports: {db.query(Report).count()}")
        print(f"Formations: {db.query(Formation).count()}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()
