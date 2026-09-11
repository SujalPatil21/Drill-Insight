@echo off
echo Starting NWIS Backend...
start cmd /k "cd c:\SIH\nwis\backend && set PYTHONPATH=c:\SIH\nwis\backend && .\venv\Scripts\python -m uvicorn app.main:app --reload"

echo Starting NWIS Frontend...
start cmd /k "cd c:\SIH\nwis\frontend && npm run dev"

echo Application launched.
