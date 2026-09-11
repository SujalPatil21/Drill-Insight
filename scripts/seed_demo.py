import os
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load env before importing models to ensure URL is correct
load_dotenv()
os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:password@localhost:5432/nwis")

from app.db.database import Base, engine
from app.models.models import Well, DrillingEvent, Formation, Report, ReportChunk, ModelPrediction, Anomaly, CandidateEvaluation

Session = sessionmaker(bind=engine)

def seed_data():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = Session()
    try:
        # Check if already seeded
        if db.query(Well).first():
            print("Database already seeded. Skipping.")
            return

        print("Seeding wells...")
        wells = [
            Well(well_id="WELL-A17", well_name="Demo Well A17", field_name="Demo Field Alpha", latitude=27.47, longitude=94.91, location="SRID=4326;POINT(94.91 27.47)", status="ACTIVE", well_type="DEVELOPMENT", total_depth=3500.0, current_depth=3248.0, current_formation="Formation X"),
            Well(well_id="WELL-A12", well_name="Demo Well A12", field_name="Demo Field Alpha", latitude=27.48, longitude=94.92, location="SRID=4326;POINT(94.92 27.48)", status="HISTORICAL", well_type="DEVELOPMENT", total_depth=3600.0, current_depth=3600.0, current_formation="Formation Y"),
            Well(well_id="WELL-B04", well_name="Demo Well B04", field_name="Demo Field Beta", latitude=27.46, longitude=94.89, location="SRID=4326;POINT(94.89 27.46)", status="HISTORICAL", well_type="EXPLORATION", total_depth=4100.0, current_depth=4100.0, current_formation="Formation Z"),
        ]
        db.add_all(wells)
        db.flush()
        
        print("Seeding formations...")
        formations = [
            Formation(formation_name="Formation X", field_name="Demo Field Alpha", top_depth=3000.0, base_depth=3400.0, description="Sandstone reservoir, known for mud loss."),
            Formation(formation_name="Formation Y", field_name="Demo Field Alpha", top_depth=3400.0, base_depth=3800.0, description="Shale layer, occasional stuck pipe issues."),
        ]
        db.add_all(formations)
        db.flush()
        
        print("Seeding drilling events...")
        events = [
            DrillingEvent(well_id="WELL-A12", event_type="MUD_LOSS", event_depth=3180.0, start_depth=3180.0, end_depth=3240.0, severity="HIGH", description="Severe mud loss encountered while drilling through Formation X.", mitigation="Pumped LCM pill. Regained partial returns.", npt_hours=12.5, formation="Formation X"),
            DrillingEvent(well_id="WELL-B04", event_type="STUCK_PIPE", event_depth=3500.0, start_depth=3500.0, end_depth=3500.0, severity="MEDIUM", description="Differential sticking.", mitigation="Spotted oil based pill. Worked pipe free.", npt_hours=8.0, formation="Formation Y"),
        ]
        db.add_all(events)

        print("Seeding reports...")
        reports = [
            Report(well_id="WELL-A12", title="WCR - Demo Well A12", report_type="WCR", file_name="wcr_A12.pdf", file_path="/data/reports/wcr_A12.pdf", report_date=datetime.now() - timedelta(days=365), extracted_text="Well completion report. Mud loss at 3180m. Severe loss of returns..."),
        ]
        db.add_all(reports)
        
        db.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
