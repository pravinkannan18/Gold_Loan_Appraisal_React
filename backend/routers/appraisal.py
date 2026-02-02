"""Appraisal API routes"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.database import get_db
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/appraisal", tags=["appraisal"])

# ============================================================================
# GET Endpoints (Read Operations)
# ============================================================================

@router.get("s")
async def get_all_appraisals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all appraisals with pagination
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100, max: 1000)
    
    Returns list of appraisals with total count
    """
    if limit > 1000:
        raise HTTPException(status_code=400, detail="Limit cannot exceed 1000")
    
    try:
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) FROM appraisals")
        total_count = cursor.fetchone()[0]
        
        # Get appraisals with pagination
        cursor.execute("""
            SELECT a.id, a.appraiser_id, a.appraiser_name, a.total_items, 
                   a.purity, a.testing_method, a.status, a.created_at
            FROM appraisals a
            ORDER BY a.created_at DESC
            LIMIT %s OFFSET %s
        """, (limit, skip))
        
        appraisals = []
        for row in cursor.fetchall():
            appraisal = {
                "id": row[0],
                "appraiser_id": row[1],
                "appraiser_name": row[2],
                "total_items": row[3] if row[3] else 0,
                "purity": row[4],
                "testing_method": row[5],
                "status": row[6],
                "created_at": str(row[7]) if row[7] else None
            }
            appraisals.append(appraisal)
        
        cursor.close()
        return {"total": total_count, "appraisals": appraisals}
        
    except Exception as e:
        logger.error(f"Error fetching appraisals: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch appraisals")

@router.get("/{appraisal_id}")
async def get_appraisal_by_id(appraisal_id: int, db: Session = Depends(get_db)):
    """
    Get a specific appraisal by ID
    
    - **appraisal_id**: Unique identifier for the appraisal
    
    Returns complete appraisal details including all related data
    """
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT a.id, a.appraiser_id, a.appraiser_name, a.total_items, 
                   a.purity, a.testing_method, a.status, a.created_at
            FROM appraisals a
            WHERE a.id = %s
        """, (appraisal_id,))
        
        row = cursor.fetchone()
        cursor.close()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Appraisal with ID {appraisal_id} not found")
        
        appraisal = {
            "id": row[0],
            "appraiser_id": row[1],
            "appraiser_name": row[2],
            "total_items": row[3] if row[3] else 0,
            "purity": row[4],
            "testing_method": row[5],
            "status": row[6],
            "created_at": str(row[7]) if row[7] else None
        }
        
        return appraisal
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appraisal {appraisal_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch appraisal")

# ============================================================================
# DELETE Endpoints (Delete Operations)
# ============================================================================

@router.delete("/{appraisal_id}", status_code=200)
async def delete_appraisal(appraisal_id: int):
    """
    Delete an appraisal by ID
    
    - **appraisal_id**: Unique identifier for the appraisal to delete
    
    Returns success message
    """
    success = db.delete_appraisal(appraisal_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Appraisal with ID {appraisal_id} not found")
    return {"success": True, "message": f"Appraisal {appraisal_id} deleted successfully"}
