from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.database import get_db
from app.models.models import Report, Well

import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter()

@router.get("/")
def get_reports(q: str = "", db: Session = Depends(get_db)):
    query = db.query(Report)
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Report.title.ilike(search),
                Report.report_type.ilike(search),
                Report.extracted_text.ilike(search)
            )
        )
    return query.limit(20).all()

@router.get("/{well_id}/pdf")
def generate_well_report_pdf(well_id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
        
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CenterTitle', parent=styles['Heading1'], alignment=1, spaceAfter=24, textColor=colors.HexColor('#087F73')))
    styles.add(ParagraphStyle(name='SectionHeader', parent=styles['Heading2'], textColor=colors.HexColor('#111111'), spaceBefore=18, spaceAfter=12))
    
    Story = []
    
    # 1. Executive Summary & Header
    Story.append(Paragraph("NWIS<br/>NEARBY WELLS INTELLIGENCE SYSTEM", styles["CenterTitle"]))
    Story.append(Paragraph("WELL INTELLIGENCE REPORT", styles["CenterTitle"]))
    
    Story.append(Paragraph("1. Executive Summary", styles["SectionHeader"]))
    Story.append(Paragraph(f"This report provides an automated data-driven synthesis of drilling context and historical intelligence for well {well.well_name} ({well.well_id}).", styles["Normal"]))
    
    # 2. Well ID
    Story.append(Paragraph("2. Well Identification", styles["SectionHeader"]))
    data = [
        ["Well ID", well.well_id],
        ["Well Name", well.well_name],
        ["Status", well.status],
        ["Type", well.well_type]
    ]
    t = Table(data, colWidths=[150, 250])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F5F5F2')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#111111')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#DDDDDD')),
    ]))
    Story.append(t)
    
    # Disclaimer
    Story.append(Spacer(1, 40))
    Story.append(Paragraph("14. Data / Demo Disclaimer", styles["SectionHeader"]))
    Story.append(Paragraph("This document was generated for demonstration purposes using synthetic intelligence rules. It should not be used as the sole basis for operational decisions.", styles["Normal"]))
    
    doc.build(Story)
    
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=NWIS_Report_{well_id}.pdf"}
    )
