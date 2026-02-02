"""
Tenant Management Router for Gold Loan Appraisal System

This router provides endpoints for:
- Banks management (CRUD operations)
- Branches management (CRUD operations) 
- Tenant users management (CRUD operations)
- Tenant hierarchy queries
- Migration utilities
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# Import models and schemas
import sys
from pathlib import Path
backend_path = Path(__file__).parent.parent
sys.path.append(str(backend_path))

from models.database import Database
from models.tenant_schemas import (
    Bank, BankCreate, BankUpdate,
    Branch, BranchCreate, BranchUpdate, 
    TenantUser, TenantUserCreate, TenantUserUpdate,
    TenantHierarchyResponse, BankStatsResponse, SessionListResponse,
    TenantSetupResponse, TenantContext
)

router = APIRouter(prefix="/api/tenant", tags=["Tenant Management"])

# Dependency to get database instance
def get_database():
    return Database()

# ============================================================================
# Banks Endpoints
# ============================================================================

@router.post("/banks", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_bank(
    bank_data: BankCreate,
    db: Database = Depends(get_database)
):
    """Create a new bank (top-level tenant)"""
    try:
        bank_id = db.create_bank(
            bank_code=bank_data.bank_code,
            bank_name=bank_data.bank_name,
            bank_short_name=bank_data.bank_short_name,
            headquarters_address=bank_data.headquarters_address,
            contact_email=bank_data.contact_email,
            contact_phone=bank_data.contact_phone,
            rbi_license_number=bank_data.rbi_license_number,
            system_configuration=bank_data.system_configuration,
            tenant_settings=bank_data.tenant_settings
        )
        
        # Fetch the created bank to return
        created_bank = db.get_bank_by_code(bank_data.bank_code)
        return {
            "message": "Bank created successfully",
            "bank_id": bank_id,
            "bank": created_bank
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create bank: {str(e)}"
        )

@router.get("/banks", response_model=List[Bank])
async def get_all_banks(
    active_only: bool = Query(True, description="Return only active banks"),
    db: Database = Depends(get_database)
):
    """Get all banks"""
    try:
        banks = db.get_all_banks()
        if active_only:
            banks = [bank for bank in banks if bank.get('is_active', True)]
        return banks
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch banks: {str(e)}"
        )

@router.get("/banks/{bank_code}", response_model=Bank)
async def get_bank_by_code(
    bank_code: str,
    db: Database = Depends(get_database)
):
    """Get bank details by bank code"""
    try:
        bank = db.get_bank_by_code(bank_code.upper())
        if not bank:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bank with code '{bank_code}' not found"
            )
        return bank
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bank: {str(e)}"
        )

@router.get("/banks/{bank_id}/stats", response_model=BankStatsResponse)
async def get_bank_stats(
    bank_id: int,
    db: Database = Depends(get_database)
):
    """Get statistics for a specific bank"""
    try:
        stats = db.get_bank_dashboard_stats(bank_id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bank statistics: {str(e)}"
        )

# ============================================================================
# Branches Endpoints
# ============================================================================

@router.post("/branches", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_branch(
    branch_data: BranchCreate,
    db: Database = Depends(get_database)
):
    """Create a new branch under a bank"""
    try:
        branch_id = db.create_branch(
            bank_id=branch_data.bank_id,
            branch_code=branch_data.branch_code,
            branch_name=branch_data.branch_name,
            branch_address=branch_data.branch_address,
            branch_city=branch_data.branch_city,
            branch_state=branch_data.branch_state,
            branch_pincode=branch_data.branch_pincode,
            contact_email=branch_data.contact_email,
            contact_phone=branch_data.contact_phone,
            manager_name=branch_data.manager_name,
            latitude=branch_data.latitude,
            longitude=branch_data.longitude,
            branch_settings=branch_data.branch_settings,
            operational_hours=branch_data.operational_hours
        )
        
        # Fetch the created branch to return
        created_branch = db.get_branch_by_code(branch_data.bank_id, branch_data.branch_code)
        return {
            "message": "Branch created successfully",
            "branch_id": branch_id,
            "branch": created_branch
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create branch: {str(e)}"
        )

@router.get("/banks/{bank_id}/branches", response_model=List[Branch])
async def get_branches_by_bank(
    bank_id: int,
    active_only: bool = Query(True, description="Return only active branches"),
    db: Database = Depends(get_database)
):
    """Get all branches for a specific bank"""
    try:
        branches = db.get_branches_by_bank(bank_id)
        if active_only:
            branches = [branch for branch in branches if branch.get('is_active', True)]
        return branches
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch branches: {str(e)}"
        )

@router.get("/banks/{bank_id}/branches/{branch_code}", response_model=Branch)
async def get_branch_by_code(
    bank_id: int,
    branch_code: str,
    db: Database = Depends(get_database)
):
    """Get branch details by bank ID and branch code"""
    try:
        branch = db.get_branch_by_code(bank_id, branch_code.upper())
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch with code '{branch_code}' not found in bank {bank_id}"
            )
        return branch
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch branch: {str(e)}"
        )

# ============================================================================
# Tenant Users Endpoints
# ============================================================================

@router.post("/users", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_tenant_user(
    user_data: TenantUserCreate,
    db: Database = Depends(get_database)
):
    """Create a new tenant user (appraiser/employee)"""
    try:
        tenant_user_id = db.create_tenant_user(
            user_id=user_data.user_id,
            bank_id=user_data.bank_id,
            branch_id=user_data.branch_id,
            full_name=user_data.full_name,
            email=user_data.email,
            phone=user_data.phone,
            employee_id=user_data.employee_id,
            designation=user_data.designation,
            face_encoding=user_data.face_encoding,
            image_data=user_data.image_data,
            user_role=user_data.user_role.value,
            permissions=user_data.permissions
        )
        
        # Fetch the created user to return
        created_user = db.get_tenant_user_by_id(user_data.bank_id, user_data.user_id)
        return {
            "message": "Tenant user created successfully",
            "tenant_user_id": tenant_user_id,
            "user": created_user
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create tenant user: {str(e)}"
        )

@router.get("/banks/{bank_id}/users", response_model=List[TenantUser])
async def get_users_by_bank(
    bank_id: int,
    active_only: bool = Query(True, description="Return only active users"),
    db: Database = Depends(get_database)
):
    """Get all users for a specific bank"""
    try:
        users = db.get_tenant_users_by_bank(bank_id)
        if active_only:
            users = [user for user in users if user.get('is_active', True)]
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.get("/branches/{branch_id}/users", response_model=List[TenantUser])
async def get_users_by_branch(
    branch_id: int,
    active_only: bool = Query(True, description="Return only active users"),
    db: Database = Depends(get_database)
):
    """Get all users for a specific branch"""
    try:
        users = db.get_tenant_users_by_branch(branch_id)
        if active_only:
            users = [user for user in users if user.get('is_active', True)]
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.get("/banks/{bank_id}/users/{user_id}", response_model=TenantUser)
async def get_tenant_user_by_id(
    bank_id: int,
    user_id: str,
    db: Database = Depends(get_database)
):
    """Get tenant user details by bank ID and user ID"""
    try:
        user = db.get_tenant_user_by_id(bank_id, user_id.upper())
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID '{user_id}' not found in bank {bank_id}"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {str(e)}"
        )

# ============================================================================
# Hierarchy and Query Endpoints
# ============================================================================

@router.get("/hierarchy", response_model=TenantHierarchyResponse)
async def get_tenant_hierarchy(
    db: Database = Depends(get_database)
):
    """Get complete tenant hierarchy (banks -> branches -> users)"""
    try:
        from utils.tenant_setup import TenantSetup
        setup = TenantSetup()
        hierarchy = setup.get_tenant_hierarchy_summary()
        return hierarchy
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tenant hierarchy: {str(e)}"
        )

@router.get("/banks/{bank_id}/sessions", response_model=SessionListResponse)
async def get_sessions_by_bank(
    bank_id: int,
    limit: int = Query(50, ge=1, le=200, description="Maximum number of sessions to return"),
    db: Database = Depends(get_database)
):
    """Get all sessions for a specific bank"""
    try:
        sessions = db.get_sessions_by_bank(bank_id, limit)
        bank_info = db.get_bank_by_code(sessions[0]['bank_name'] if sessions else '')
        
        return {
            "sessions": sessions,
            "total_count": len(sessions),
            "bank_context": bank_info
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sessions: {str(e)}"
        )

@router.get("/branches/{branch_id}/sessions", response_model=SessionListResponse)
async def get_sessions_by_branch(
    branch_id: int,
    limit: int = Query(50, ge=1, le=200, description="Maximum number of sessions to return"),
    db: Database = Depends(get_database)
):
    """Get all sessions for a specific branch"""
    try:
        sessions = db.get_sessions_by_branch(branch_id, limit)
        
        return {
            "sessions": sessions,
            "total_count": len(sessions),
            "branch_context": sessions[0] if sessions else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sessions: {str(e)}"
        )

@router.get("/users/{tenant_user_id}/sessions", response_model=SessionListResponse)
async def get_sessions_by_tenant_user(
    tenant_user_id: int,
    limit: int = Query(50, ge=1, le=200, description="Maximum number of sessions to return"),
    db: Database = Depends(get_database)
):
    """Get all sessions for a specific tenant user (appraiser)"""
    try:
        sessions = db.get_sessions_by_tenant_user(tenant_user_id, limit)
        
        return {
            "sessions": sessions,
            "total_count": len(sessions)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sessions: {str(e)}"
        )

# ============================================================================
# Migration and Setup Endpoints
# ============================================================================

@router.post("/setup", response_model=TenantSetupResponse)
async def setup_tenant_system(
    create_sample_data: bool = Query(True, description="Create sample banks and branches"),
    migrate_existing: bool = Query(True, description="Migrate existing legacy data"),
    db: Database = Depends(get_database)
):
    """Setup complete tenant system with optional sample data and migration"""
    try:
        from utils.tenant_setup import TenantSetup
        setup = TenantSetup()
        
        result = {"status": "success", "setup_summary": {}, "sample_data": None, "migration_result": None}
        
        if create_sample_data:
            sample_data = setup.create_sample_banks_and_branches()
            result["sample_data"] = sample_data
            result["setup_summary"]["sample_banks"] = len(sample_data.get("banks", []))
            result["setup_summary"]["sample_branches"] = len(sample_data.get("branches", []))
            result["setup_summary"]["sample_users"] = len(sample_data.get("users", []))
        
        if migrate_existing:
            migration_result = setup.migrate_existing_data()
            result["migration_result"] = migration_result
            result["setup_summary"]["migrated_combinations"] = migration_result.get("migrated_combinations", 0)
        
        # Get final counts
        banks = db.get_all_banks()
        total_branches = 0
        total_users = 0
        
        for bank in banks:
            branches = db.get_branches_by_bank(bank['id'])
            users = db.get_tenant_users_by_bank(bank['id'])
            total_branches += len(branches)
            total_users += len(users)
        
        result["setup_summary"]["total_banks"] = len(banks)
        result["setup_summary"]["total_branches"] = total_branches
        result["setup_summary"]["total_users"] = total_users
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to setup tenant system: {str(e)}"
        )

@router.post("/migrate")
async def migrate_legacy_data(
    db: Database = Depends(get_database)
):
    """Migrate existing legacy bank/branch data to tenant hierarchy"""
    try:
        migrated_count = db.migrate_legacy_bank_branch_data()
        return {
            "message": "Legacy data migration completed",
            "migrated_combinations": migrated_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to migrate legacy data: {str(e)}"
        )

# ============================================================================
# Utility Endpoints
# ============================================================================

@router.get("/resolve-context")
async def resolve_tenant_context(
    bank_code: Optional[str] = Query(None, description="Bank code"),
    branch_code: Optional[str] = Query(None, description="Branch code"),
    user_id: Optional[str] = Query(None, description="User ID"),
    db: Database = Depends(get_database)
):
    """Resolve tenant context from codes to get full hierarchy information"""
    try:
        context = TenantContext()
        
        # Resolve bank
        if bank_code:
            bank = db.get_bank_by_code(bank_code.upper())
            if bank:
                context.bank_id = bank['id']
                context.bank_code = bank['bank_code']
                context.bank_name = bank['bank_name']
                
                # Resolve branch if provided
                if branch_code:
                    branch = db.get_branch_by_code(bank['id'], branch_code.upper())
                    if branch:
                        context.branch_id = branch['id']
                        context.branch_code = branch['branch_code']
                        context.branch_name = branch['branch_name']
                
                # Resolve user if provided
                if user_id:
                    user = db.get_tenant_user_by_id(bank['id'], user_id.upper())
                    if user:
                        context.tenant_user_id = user['id']
                        context.user_id = user['user_id']
                        context.user_full_name = user['full_name']
                        context.user_role = user['user_role']
                        context.permissions = user.get('permissions', {})
        
        return context.dict()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve tenant context: {str(e)}"
        )

@router.get("/stats")
async def get_tenant_statistics(
    db: Database = Depends(get_database)
):
    """Get overall tenant system statistics"""
    try:
        stats = db.get_statistics()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tenant statistics: {str(e)}"
        )