from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter()

class RagQuery(BaseModel):
    query: str
    top_k: int = 3
    filters: dict = None

@router.post("/search")
def search_historical_reports(request: RagQuery):
    # Mocking pgvector semantic search
    mock_results = [
        {
            "chunk_id": "chunk-102",
            "report_title": "WCR - WELL-A12",
            "similarity_score": 0.92,
            "content": "Severe mud loss encountered while drilling through Formation X at 3180m. Pumped LCM pill to regain partial returns. Observed 12.5 hours of NPT."
        },
        {
            "chunk_id": "chunk-55",
            "report_title": "WCR - WELL-B04",
            "similarity_score": 0.76,
            "content": "Differential sticking occurred at 3500m in Formation Y. Spotted oil based pill and worked pipe free."
        },
        {
            "chunk_id": "chunk-89",
            "report_title": "End of Well Report - WELL-C01",
            "similarity_score": 0.61,
            "content": "Drilling proceeded smoothly through Formation X. Minor losses observed but manageable with standard mud weight."
        }
    ]
    
    # Return top_k results
    return {
        "query": request.query,
        "results": mock_results[:request.top_k]
    }
