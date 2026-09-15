from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
# anomaly APIs not yet fully implemented
from app.api import wells, risk, candidates, rag, dashboard, recommendation, search, reports, debug, auth, historical


app = FastAPI(title="NWIS - Nearby Wells Intelligence System", version="1.0.0")

# Logging setup
import logging
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.database import get_db

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"[API REQUEST] {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"[API RESPONSE] {request.method} {request.url.path} -> {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"[API ERROR] {request.method} {request.url.path} failed with: {str(e)}", exc_info=True)
        raise

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Check DB connection
        db.execute(text("SELECT 1"))
        
        # Check PostGIS
        pg_res = db.execute(text("SELECT extversion FROM pg_extension WHERE extname = 'postgis';")).fetchone()
        postgis_status = "available" if pg_res else "unavailable"
        
        # Check pgvector
        vec_res = db.execute(text("SELECT extversion FROM pg_extension WHERE extname = 'vector';")).fetchone()
        pgvector_status = "available" if vec_res else "unavailable"
        
        # Get PostgreSQL version
        pg_version = db.execute(text("SHOW server_version;")).fetchone()[0]

        return {
            "status": "ok",
            "database": "connected",
            "database_name": "NWIS",
            "postgresql_version": pg_version,
            "postgis": postgis_status,
            "pgvector": pgvector_status,
            "ml_mode": "demo"
        }
    except Exception as e:
        logger.error("Health check failed", exc_info=True)
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e)
        }

app.include_router(wells.router, prefix="/api/wells", tags=["wells"])
app.include_router(recommendation.router, prefix="/api/wells", tags=["wells"])
app.include_router(risk.router, prefix="/api/risk", tags=["risk"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["candidates"])
# app.include_router(anomaly.router, prefix="/api/anomaly", tags=["anomaly"])
app.include_router(rag.router, prefix="/api/rag", tags=["rag"])

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(debug.router, prefix="/api/debug", tags=["debug"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(historical.router, prefix="/api/historical", tags=["historical"])
