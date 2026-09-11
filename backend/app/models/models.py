from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from pgvector.sqlalchemy import Vector
from app.db.database import Base


class Engineer(Base):
    __tablename__ = "engineers"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Well(Base):
    __tablename__ = "wells"

    id = Column(Integer, primary_key=True, index=True)

    well_id = Column(String, unique=True, index=True, nullable=False)
    well_name = Column(String, nullable=False)
    field_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    status = Column(String)
    well_type = Column(String)
    total_depth = Column(Float)
    current_depth = Column(Float)
    current_formation = Column(String)
    spud_date = Column(DateTime(timezone=True))
    completion_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class DrillingObservation(Base):
    __tablename__ = "drilling_observations"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.well_id"))
    timestamp = Column(DateTime(timezone=True), default=func.now())
    measured_depth = Column(Float)
    formation = Column(String)
    parameters = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DrillingEvent(Base):
    __tablename__ = "drilling_events"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.well_id"))
    event_type = Column(String)
    event_depth = Column(Float)
    start_depth = Column(Float)
    end_depth = Column(Float)
    severity = Column(String)
    description = Column(String)
    root_cause = Column(String)
    mitigation = Column(String)
    npt_hours = Column(Float)
    formation = Column(String)
    timestamp = Column(DateTime(timezone=True), default=func.now())
    metadata_info = Column("metadata", JSON) # using metadata_info as python name

class Formation(Base):
    __tablename__ = "formations"

    id = Column(Integer, primary_key=True, index=True)
    formation_name = Column(String, index=True)
    field_name = Column(String)
    top_depth = Column(Float)
    base_depth = Column(Float)
    description = Column(String)
    metadata_info = Column("metadata", JSON)

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.well_id"), nullable=True)
    title = Column(String)
    report_type = Column(String)
    file_name = Column(String)
    file_path = Column(String)
    report_date = Column(DateTime(timezone=True))
    extracted_text = Column(String)
    metadata_info = Column("metadata", JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ReportChunk(Base):
    __tablename__ = "report_chunks"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    chunk_index = Column(Integer)
    content = Column(String)
    # pgvector missing locally; using JSON to avoid migration failure
    # embedding = Column(Vector(384))
    embedding = Column(JSON)
    metadata_info = Column("metadata", JSON)

class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.well_id"), nullable=True)
    prediction_type = Column(String)
    prediction_timestamp = Column(DateTime(timezone=True), default=func.now())
    measured_depth = Column(Float, nullable=True)
    result = Column(JSON)
    model_version = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.well_id"))
    timestamp = Column(DateTime(timezone=True), default=func.now())
    measured_depth = Column(Float)
    parameter = Column(String)
    observed_value = Column(Float)
    expected_value = Column(String) # Can be a range string or float
    deviation = Column(Float)
    anomaly_score = Column(Float)
    severity = Column(String)
    metadata_info = Column("metadata", JSON)

class CandidateEvaluation(Base):
    __tablename__ = "candidate_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String, unique=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    overall_suitability = Column(Float)
    prospectivity = Column(Float)
    geological_suitability = Column(Float)
    drilling_risk_level = Column(String)
    result = Column(JSON)
    model_version = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
