"""Appraisal API routes"""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/appraisal", tags=["appraisal"])

# ============================================================================
# Dependency Injection
# ============================================================================

db = None

def set_database(database):
    global db
    db = database

# ============================================================================
# GET Endpoints (Read Operations)
# ============================================================================

@router.get("s", response_model=None)
async def get_all_appraisals(skip: int = 0, limit: int = 100):
    """
    Get all appraisals with pagination
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100, max: 1000)
    
    Returns list of appraisals with total count
    """
    if limit > 1000:
        raise HTTPException(status_code=400, detail="Limit cannot exceed 1000")
    
    appraisals = db.get_all_appraisals(skip=skip, limit=limit)
    return {"total": len(appraisals), "appraisals": appraisals}

@router.get("/{appraisal_id}", response_model=None)
async def get_appraisal_by_id(appraisal_id: int):
    """
    Get a specific appraisal by ID
    
    - **appraisal_id**: Unique identifier for the appraisal
    
    Returns complete appraisal details including all related data
    """
    appraisal = db.get_appraisal_by_id(appraisal_id)
    if not appraisal:
        raise HTTPException(status_code=404, detail=f"Appraisal with ID {appraisal_id} not found")
    return appraisal

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
