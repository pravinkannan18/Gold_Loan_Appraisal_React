"""
Admin management API router
Handles all admin-related operations including tenant users management
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from models.database import get_db
from schemas.tenant import AdminUserResponse, AdminUserCreate, AdminUserUpdate
import logging
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ============================================================================
# Helper Functions
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password for comparison"""
    return hashlib.sha256(password.encode()).hexdigest()

# ============================================================================
# Login Models
# ============================================================================

class AdminLoginRequest(BaseModel):
    """Admin login request model"""
    email: EmailStr
    password: str
    bank_id: Optional[int] = None
    branch_id: Optional[int] = None
    role: str

class AdminLoginResponse(BaseModel):
    """Admin login response model"""
    success: bool
    message: str
    user: Optional[dict] = None

# ============================================================================
# Login Endpoint
# ============================================================================

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(login_data: AdminLoginRequest, db: Session = Depends(get_db)) -> AdminLoginResponse:
    """Admin login endpoint with support for branch-specific authentication"""
    try:
        cursor = db.cursor()
        
        # Check if it's a branch-specific login (using branch admin credentials from tenant_users)
        if login_data.role == 'branch_admin':
            # Branch admin login using email/password set by bank admin
            # Also verify they have access to the specified bank and branch
            if not login_data.bank_id or not login_data.branch_id:
                cursor.close()
                return AdminLoginResponse(
                    success=False,
                    message="Please select both bank and branch for branch admin login"
                )
            
            password_hash = hash_password(login_data.password)
            cursor.execute("""
                SELECT tu.id, tu.full_name, tu.email, tu.user_role, tu.bank_id, tu.branch_id,
                       b.branch_name, bk.bank_name, tu.face_encoding as password_hash
                FROM tenant_users tu
                LEFT JOIN branches b ON tu.branch_id = b.id
                LEFT JOIN banks bk ON tu.bank_id = bk.id
                WHERE tu.email = %s AND tu.user_role = 'branch_admin' 
                AND tu.face_encoding = %s AND tu.is_active = true
                AND tu.bank_id = %s AND tu.branch_id = %s
            """, (login_data.email, password_hash, login_data.bank_id, login_data.branch_id))
            
            admin = cursor.fetchone()
            if admin:
                # Update last login
                cursor.execute("""
                    UPDATE tenant_users SET last_login = CURRENT_TIMESTAMP WHERE id = %s
                """, (admin[0],))
                db.commit()
                cursor.close()
                return AdminLoginResponse(
                    success=True,
                    message="Branch admin login successful",
                    user={
                        "id": admin[0],
                        "name": admin[1] or "Branch Admin",
                        "email": admin[2],
                        "role": "branch_admin",
                        "bank_id": admin[4],
                        "branch_id": admin[5],
                        "bank_name": admin[7],
                        "branch_name": admin[6]
                    }
                )
            else:
                cursor.close()
                return AdminLoginResponse(
                    success=False,
                    message="Invalid credentials or you don't have access to the selected branch"
                )
        
        # Bank admin login - Check bank_admins table first with password verification
        if login_data.role == 'bank_admin' and login_data.bank_id:
            # First check bank_admins table
            password_hash = hash_password(login_data.password)
            logger.info(f"Login attempt - Email: {login_data.email}, Bank ID: {login_data.bank_id}, Password hash: {password_hash[:16]}...")
            
            cursor.execute("""
                SELECT ba.id, ba.full_name, ba.email, ba.bank_id, ba.phone,
                       b.bank_name, ba.password_hash
                FROM bank_admins ba
                LEFT JOIN banks b ON ba.bank_id = b.id
                WHERE ba.email = %s AND ba.bank_id = %s AND ba.is_active = TRUE
            """, (login_data.email, login_data.bank_id))
            
            admin = cursor.fetchone()
            if not admin:
                logger.info(f"No bank admin found for email {login_data.email} and bank_id {login_data.bank_id}")
                cursor.close()
                return AdminLoginResponse(
                    success=False,
                    message="Invalid credentials or access denied"
                )
            
            stored_hash = admin[6]
            logger.info(f"Found admin - Stored hash: {stored_hash[:16]}..., Input hash: {password_hash[:16]}...")
            logger.info(f"Hash match: {stored_hash == password_hash}")
            
            # Verify password
            if stored_hash != password_hash:
                cursor.close()
                return AdminLoginResponse(
                    success=False,
                    message="Invalid credentials or access denied"
                )
            
            # Update last login
            cursor.execute("""
                UPDATE bank_admins SET last_login = CURRENT_TIMESTAMP WHERE id = %s
            """, (admin[0],))
            db.commit()
            cursor.close()
            return AdminLoginResponse(
                success=True,
                message="Bank admin login successful",
                user={
                    "id": admin[0],
                    "name": admin[1] or "Bank Admin",
                    "email": admin[2],
                    "role": "bank_admin",
                    "bank_id": admin[3],
                    "branch_id": None,
                    "bank_name": admin[5],
                    "branch_name": None
                }
            )
            
            # Fallback to tenant_users table (for existing users without password reset)
            cursor.execute("""
                SELECT tu.id, tu.full_name, tu.email, tu.user_role, tu.bank_id, tu.branch_id,
                       b.bank_name, br.branch_name
                FROM tenant_users tu
                LEFT JOIN banks b ON tu.bank_id = b.id
                LEFT JOIN branches br ON tu.branch_id = br.id
                WHERE tu.email = %s AND tu.bank_id = %s AND tu.is_active = true
            """, (login_data.email, login_data.bank_id))
            
            user = cursor.fetchone()
            if user:
                cursor.close()
                return AdminLoginResponse(
                    success=True,
                    message="Login successful",
                    user={
                        "id": user[0],
                        "name": user[1],
                        "email": user[2],
                        "role": user[3],
                        "bank_id": user[4],
                        "branch_id": user[5],
                        "bank_name": user[6],
                        "branch_name": user[7]
                    }
                )
        
        cursor.close()
        # Login failed
        return AdminLoginResponse(
            success=False,
            message="Invalid credentials or access denied",
            user=None
        )
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_admin_users(
    bank_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db)
) -> List[AdminUserResponse]:
    """Get all admin users with optional bank/branch filtering"""
    try:
        cursor = db.cursor()
        
        # Base query
        base_query = """
            SELECT tu.id, tu.full_name, tu.email, tu.user_role, tu.phone, tu.employee_id,
                   tu.bank_id, tu.branch_id, tu.is_active, tu.created_at,
                   b.bank_name, br.branch_name
            FROM tenant_users tu
            LEFT JOIN banks b ON tu.bank_id = b.id
            LEFT JOIN branches br ON tu.branch_id = br.id
        """
        
        # Add filters
        where_conditions = []
        params = []
        
        if bank_id:
            where_conditions.append("tu.bank_id = %s")
            params.append(bank_id)
            
        if branch_id:
            where_conditions.append("tu.branch_id = %s")
            params.append(branch_id)
        
        if where_conditions:
            query = f"{base_query} WHERE {' AND '.join(where_conditions)}"
        else:
            query = base_query
            
        query += " ORDER BY tu.full_name"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        users = []
        for row in rows:
            users.append(AdminUserResponse(
                id=row[0],
                name=row[1],
                email=row[2],
                role=row[3],
                phone=row[4],
                employee_id=row[5],
                bank_id=row[6],
                branch_id=row[7],
                is_active=row[8],
                created_at=row[9],
                bank_name=row[10],
                branch_name=row[11]
            ))
        
        cursor.close()
        logger.info(f"Retrieved {len(users)} admin users")
        return users
        
    except Exception as e:
        logger.error(f"Error retrieving admin users: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving admin users: {str(e)}")

@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_admin_user(user_id: int, db: Session = Depends(get_db)) -> AdminUserResponse:
    """Get a specific admin user by ID"""
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT tu.id, tu.full_name, tu.email, tu.user_role, tu.phone, tu.employee_id,
                   tu.bank_id, tu.branch_id, tu.is_active, tu.created_at,
                   b.bank_name, br.branch_name
            FROM tenant_users tu
            LEFT JOIN banks b ON tu.bank_id = b.id
            LEFT JOIN branches br ON tu.branch_id = br.id
            WHERE tu.id = %s
        """, (user_id,))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Admin user not found")
        
        user = AdminUserResponse(
            id=row[0],
            name=row[1],
            email=row[2],
            role=row[3],
            phone=row[4],
            employee_id=row[5],
            bank_id=row[6],
            branch_id=row[7],
            is_active=row[8],
            created_at=row[9],
            bank_name=row[10],
            branch_name=row[11]
        )
        
        cursor.close()
        logger.info(f"Retrieved admin user {user_id}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving admin user: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving admin user: {str(e)}")

@router.post("/users", response_model=AdminUserResponse)
async def create_admin_user(user: AdminUserCreate, db: Session = Depends(get_db)) -> AdminUserResponse:
    """Create a new admin user"""
    try:
        cursor = db.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT id FROM tenant_users WHERE email = %s", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Check if employee_id already exists (if provided)
        if user.employee_id:
            cursor.execute("SELECT id FROM tenant_users WHERE employee_id = %s", (user.employee_id,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Employee ID already exists")
        
        # Validate bank exists
        if user.bank_id:
            cursor.execute("SELECT id FROM banks WHERE id = %s", (user.bank_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=400, detail="Bank not found")
        
        # Validate branch exists and belongs to bank (if both provided)
        if user.branch_id:
            if user.bank_id:
                cursor.execute("SELECT id FROM branches WHERE id = %s AND bank_id = %s", 
                              (user.branch_id, user.bank_id))
            else:
                cursor.execute("SELECT id FROM branches WHERE id = %s", (user.branch_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=400, detail="Branch not found or does not belong to specified bank")
        
        # Create user
        cursor.execute("""
            INSERT INTO tenant_users (name, email, role, phone, employee_id, bank_id, branch_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            user.name, user.email, user.role, user.phone, user.employee_id,
            user.bank_id, user.branch_id
        ))
        
        result = cursor.fetchone()
        db.commit()
        
        # Get bank and branch names
        bank_name = None
        branch_name = None
        
        if user.bank_id:
            cursor.execute("SELECT bank_name FROM banks WHERE id = %s", (user.bank_id,))
            bank_result = cursor.fetchone()
            bank_name = bank_result[0] if bank_result else None
            
        if user.branch_id:
            cursor.execute("SELECT branch_name FROM branches WHERE id = %s", (user.branch_id,))
            branch_result = cursor.fetchone()
            branch_name = branch_result[0] if branch_result else None
        
        cursor.close()
        
        # Return created user
        created_user = AdminUserResponse(
            id=result[0],
            name=user.name,
            email=user.email,
            role=user.role,
            phone=user.phone,
            employee_id=user.employee_id,
            bank_id=user.bank_id,
            branch_id=user.branch_id,
            is_active=True,
            created_at=result[1],
            bank_name=bank_name,
            branch_name=branch_name
        )
        
        logger.info(f"Created admin user {user.email}")
        return created_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating admin user: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating admin user: {str(e)}")

@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_admin_user(user_id: int, user: AdminUserUpdate, db: Session = Depends(get_db)) -> AdminUserResponse:
    """Update an existing admin user"""
    try:
        cursor = db.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM tenant_users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Admin user not found")
        
        # Check email uniqueness (if updating email)
        if user.email is not None:
            cursor.execute("SELECT id FROM tenant_users WHERE email = %s AND id != %s", (user.email, user_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email already exists")
        
        # Check employee_id uniqueness (if updating employee_id)
        if user.employee_id is not None:
            cursor.execute("SELECT id FROM tenant_users WHERE employee_id = %s AND id != %s", 
                          (user.employee_id, user_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Employee ID already exists")
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        if user.name is not None:
            update_fields.append("name = %s")
            update_values.append(user.name)
        if user.email is not None:
            update_fields.append("email = %s")
            update_values.append(user.email)
        if user.role is not None:
            update_fields.append("role = %s")
            update_values.append(user.role)
        if user.phone is not None:
            update_fields.append("phone = %s")
            update_values.append(user.phone)
        if user.employee_id is not None:
            update_fields.append("employee_id = %s")
            update_values.append(user.employee_id)
        if user.bank_id is not None:
            update_fields.append("bank_id = %s")
            update_values.append(user.bank_id)
        if user.branch_id is not None:
            update_fields.append("branch_id = %s")
            update_values.append(user.branch_id)
        if user.is_active is not None:
            update_fields.append("is_active = %s")
            update_values.append(user.is_active)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_values.append(user_id)
        update_query = f"UPDATE tenant_users SET {', '.join(update_fields)} WHERE id = %s"
        
        cursor.execute(update_query, update_values)
        db.commit()
        
        # Get updated user
        cursor.execute("""
            SELECT tu.id, tu.full_name, tu.email, tu.user_role, tu.phone, tu.employee_id,
                   tu.bank_id, tu.branch_id, tu.is_active, tu.created_at,
                   b.bank_name, br.branch_name
            FROM tenant_users tu
            LEFT JOIN banks b ON tu.bank_id = b.id
            LEFT JOIN branches br ON tu.branch_id = br.id
            WHERE tu.id = %s
        """, (user_id,))
        
        row = cursor.fetchone()
        updated_user = AdminUserResponse(
            id=row[0],
            name=row[1],
            email=row[2],
            role=row[3],
            phone=row[4],
            employee_id=row[5],
            bank_id=row[6],
            branch_id=row[7],
            is_active=row[8],
            created_at=row[9],
            bank_name=row[10],
            branch_name=row[11]
        )
        
        cursor.close()
        logger.info(f"Updated admin user {user_id}")
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating admin user: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating admin user: {str(e)}")

@router.delete("/users/{user_id}")
async def delete_admin_user(user_id: int, db: Session = Depends(get_db)):
    """Delete an admin user"""
    try:
        cursor = db.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM tenant_users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Admin user not found")
        
        # Delete user
        cursor.execute("DELETE FROM tenant_users WHERE id = %s", (user_id,))
        db.commit()
        cursor.close()
        
        logger.info(f"Deleted admin user {user_id}")
        return {"message": "Admin user deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting admin user: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting admin user: {str(e)}")

@router.get("/statistics")
async def get_admin_statistics(db: Session = Depends(get_db)):
    """Get overall system statistics"""
    try:
        cursor = db.cursor()
        
        # Get total counts
        cursor.execute("SELECT COUNT(*) FROM banks")
        total_banks = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM branches")
        total_branches = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tenant_users")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tenant_users WHERE is_active = true")
        active_users = cursor.fetchone()[0]
        
        # Get banks with their branch counts
        cursor.execute("""
            SELECT b.id, b.bank_name, b.bank_code, COUNT(br.id) as branch_count
            FROM banks b
            LEFT JOIN branches br ON b.id = br.bank_id
            GROUP BY b.id, b.bank_name, b.bank_code
            ORDER BY b.bank_name
        """)
        bank_stats = cursor.fetchall()
        
        # Get user distribution by role
        cursor.execute("""
            SELECT role, COUNT(*) as count
            FROM tenant_users
            GROUP BY role
            ORDER BY role
        """)
        role_distribution = cursor.fetchall()
        
        cursor.close()
        
        statistics = {
            "overview": {
                "total_banks": total_banks,
                "total_branches": total_branches,
                "total_users": total_users,
                "active_users": active_users
            },
            "banks": [
                {
                    "id": bank[0],
                    "name": bank[1],
                    "code": bank[2],
                    "branch_count": bank[3]
                }
                for bank in bank_stats
            ],
            "user_roles": [
                {
                    "role": role[0],
                    "count": role[1]
                }
                for role in role_distribution
            ]
        }
        
        logger.info("Retrieved admin statistics")
        return statistics
        
    except Exception as e:
        logger.error(f"Error retrieving admin statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving statistics: {str(e)}")


# ============================================================================
# Bank Admin Management (for Super Admin)
# ============================================================================

class BankAdminCreate(BaseModel):
    """Create bank admin model"""
    bank_id: int
    email: EmailStr
    password: str
    phone: Optional[str] = None
    full_name: Optional[str] = None

class BankAdminResponse(BaseModel):
    """Bank admin response model"""
    id: int
    bank_id: int
    email: str
    phone: Optional[str]
    full_name: Optional[str]
    is_active: bool
    bank_name: Optional[str] = None
    created_at: Optional[str] = None

@router.post("/bank-admin", response_model=BankAdminResponse)
async def create_bank_admin(data: BankAdminCreate, db = Depends(get_db)):
    """Create a new bank admin with password (Super Admin only)"""
    try:
        cursor = db.cursor()
        
        # Check if bank exists
        cursor.execute("SELECT id, bank_name FROM banks WHERE id = %s", (data.bank_id,))
        bank = cursor.fetchone()
        if not bank:
            raise HTTPException(status_code=404, detail="Bank not found")
        
        # Check if admin already exists for this bank and email
        cursor.execute("""
            SELECT id FROM bank_admins WHERE bank_id = %s AND email = %s
        """, (data.bank_id, data.email))
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Bank admin with this email already exists for this bank")
        
        # Hash password
        password_hash = hash_password(data.password)
        
        # Create bank admin
        cursor.execute("""
            INSERT INTO bank_admins (bank_id, email, password_hash, phone, full_name)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (data.bank_id, data.email, password_hash, data.phone, data.full_name))
        
        result = cursor.fetchone()
        db.commit()
        cursor.close()
        
        logger.info(f"Created bank admin for bank {data.bank_id}: {data.email}")
        
        return BankAdminResponse(
            id=result[0],
            bank_id=data.bank_id,
            email=data.email,
            phone=data.phone,
            full_name=data.full_name,
            is_active=True,
            bank_name=bank[1],
            created_at=str(result[1]) if result[1] else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating bank admin: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating bank admin: {str(e)}")

@router.get("/bank-admins/{bank_id}", response_model=List[BankAdminResponse])
async def get_bank_admins(bank_id: int, db = Depends(get_db)):
    """Get all admins for a bank"""
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT ba.id, ba.bank_id, ba.email, ba.phone, ba.full_name, ba.is_active, 
                   ba.created_at, b.bank_name
            FROM bank_admins ba
            LEFT JOIN banks b ON ba.bank_id = b.id
            WHERE ba.bank_id = %s
            ORDER BY ba.created_at DESC
        """, (bank_id,))
        
        rows = cursor.fetchall()
        cursor.close()
        
        return [
            BankAdminResponse(
                id=row[0],
                bank_id=row[1],
                email=row[2],
                phone=row[3],
                full_name=row[4],
                is_active=row[5],
                created_at=str(row[6]) if row[6] else None,
                bank_name=row[7]
            )
            for row in rows
        ]
        
    except Exception as e:
        logger.error(f"Error getting bank admins: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting bank admins: {str(e)}")

@router.delete("/bank-admin/{admin_id}")
async def delete_bank_admin(admin_id: int, db = Depends(get_db)):
    """Delete a bank admin (Super Admin only)"""
    try:
        cursor = db.cursor()
        
        # Check if admin exists
        cursor.execute("SELECT id FROM bank_admins WHERE id = %s", (admin_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Bank admin not found")
        
        # Delete admin
        cursor.execute("DELETE FROM bank_admins WHERE id = %s", (admin_id,))
        db.commit()
        cursor.close()
        
        logger.info(f"Deleted bank admin {admin_id}")
        return {"message": "Bank admin deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting bank admin: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting bank admin: {str(e)}")

# ============================================================================
# Branch Admin Management (for Bank Admins)
# ============================================================================

class BranchAdminCreate(BaseModel):
    """Branch admin creation model"""
    branch_id: int
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class BranchAdminResponse(BaseModel):
    """Branch admin response model"""
    id: int
    user_id: str
    branch_id: int
    bank_id: int
    email: str
    phone: Optional[str]
    full_name: str
    is_active: bool
    created_at: Optional[str]
    branch_name: Optional[str]
    bank_name: Optional[str]

@router.post("/branch-admin", response_model=BranchAdminResponse)
async def create_branch_admin(data: BranchAdminCreate, db = Depends(get_db)):
    """Create a new branch admin (Bank Admin only)"""
    try:
        cursor = db.cursor()
        
        # Check if branch exists and get bank_id
        cursor.execute("""
            SELECT b.id, b.branch_name, b.bank_id, bk.bank_name 
            FROM branches b
            LEFT JOIN banks bk ON b.bank_id = bk.id
            WHERE b.id = %s
        """, (data.branch_id,))
        branch = cursor.fetchone()
        
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        
        branch_id, branch_name, bank_id, bank_name = branch
        
        # Check if email already exists in tenant_users
        cursor.execute("SELECT id FROM tenant_users WHERE email = %s", (data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Generate unique user_id
        import uuid
        user_id = f"BA_{bank_id}_{branch_id}_{str(uuid.uuid4())[:8]}"
        
        # Hash password for branch admin login
        password_hash = hash_password(data.password)
        
        # For branch admins, we store them in tenant_users table with password hash in face_encoding field
        cursor.execute("""
            INSERT INTO tenant_users (
                user_id, bank_id, branch_id, full_name, email, phone, 
                user_role, face_encoding, is_active, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            user_id, bank_id, branch_id, data.full_name, 
            data.email, data.phone, 'branch_admin', password_hash, True
        ))
        
        new_id = cursor.fetchone()[0]
        db.commit()
        cursor.close()
        
        logger.info(f"Created branch admin: {data.email} for branch {branch_name}")
        
        return BranchAdminResponse(
            id=new_id,
            user_id=user_id,
            branch_id=branch_id,
            bank_id=bank_id,
            email=data.email,
            phone=data.phone,
            full_name=data.full_name,
            is_active=True,
            created_at=str(datetime.now()),
            branch_name=branch_name,
            bank_name=bank_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating branch admin: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating branch admin: {str(e)}")

@router.get("/branch-admins/{bank_id}", response_model=List[BranchAdminResponse])
async def get_branch_admins(bank_id: int, db = Depends(get_db)):
    """Get all branch admins for a bank (Bank Admin only)"""
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT tu.id, tu.user_id, tu.branch_id, tu.bank_id, tu.email, tu.phone, 
                   tu.full_name, tu.is_active, tu.created_at,
                   b.branch_name, bk.bank_name
            FROM tenant_users tu
            LEFT JOIN branches b ON tu.branch_id = b.id
            LEFT JOIN banks bk ON tu.bank_id = bk.id
            WHERE tu.bank_id = %s AND tu.user_role = 'branch_admin'
            ORDER BY tu.created_at DESC
        """, (bank_id,))
        
        rows = cursor.fetchall()
        cursor.close()
        
        return [
            BranchAdminResponse(
                id=row[0],
                user_id=row[1],
                branch_id=row[2],
                bank_id=row[3],
                email=row[4],
                phone=row[5],
                full_name=row[6],
                is_active=row[7],
                created_at=str(row[8]) if row[8] else None,
                branch_name=row[9],
                bank_name=row[10]
            )
            for row in rows
        ]
        
    except Exception as e:
        logger.error(f"Error getting branch admins: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting branch admins: {str(e)}")

@router.delete("/branch-admin/{admin_id}")
async def delete_branch_admin(admin_id: int, db = Depends(get_db)):
    """Delete a branch admin (Bank Admin only)"""
    try:
        cursor = db.cursor()
        
        # Check if admin exists
        cursor.execute("""
            SELECT id FROM tenant_users 
            WHERE id = %s AND user_role = 'branch_admin'
        """, (admin_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Branch admin not found")
        
        # Delete admin
        cursor.execute("""
            DELETE FROM tenant_users 
            WHERE id = %s AND user_role = 'branch_admin'
        """, (admin_id,))
        db.commit()
        cursor.close()
        
        logger.info(f"Deleted branch admin {admin_id}")
        return {"message": "Branch admin deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting branch admin: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting branch admin: {str(e)}")

@router.get("/all-branch-admins", response_model=List[BranchAdminResponse])
async def get_all_branch_admins(db = Depends(get_db)):
    """Get all branch admins across all banks (Super Admin only)"""
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT tu.id, tu.user_id, tu.branch_id, tu.bank_id, tu.email, tu.phone, 
                   tu.full_name, tu.is_active, tu.created_at,
                   b.branch_name, bk.bank_name
            FROM tenant_users tu
            LEFT JOIN branches b ON tu.branch_id = b.id
            LEFT JOIN banks bk ON tu.bank_id = bk.id
            WHERE tu.user_role = 'branch_admin'
            ORDER BY bk.bank_name, b.branch_name, tu.created_at DESC
        """)
        
        rows = cursor.fetchall()
        cursor.close()
        
        return [
            BranchAdminResponse(
                id=row[0],
                user_id=row[1],
                branch_id=row[2],
                bank_id=row[3],
                email=row[4],
                phone=row[5],
                full_name=row[6],
                is_active=row[7],
                created_at=str(row[8]) if row[8] else None,
                branch_name=row[9],
                bank_name=row[10]
            )
            for row in rows
        ]
        
    except Exception as e:
        logger.error(f"Error getting all branch admins: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting all branch admins: {str(e)}")

# ============================================================================
# Appraiser Verification Endpoint
# ============================================================================

class AppraiserVerificationRequest(BaseModel):
    """Request model for appraiser verification"""
    name: str
    bank_id: int
    branch_id: int

class AppraiserVerificationResponse(BaseModel):
    """Response model for appraiser verification"""
    exists: bool
    message: str
    appraiser: Optional[dict] = None

@router.post("/verify-appraiser", response_model=AppraiserVerificationResponse)
async def verify_appraiser(request: AppraiserVerificationRequest, db: Session = Depends(get_db)) -> AppraiserVerificationResponse:
    """
    Verify if an appraiser exists in the specified bank and branch
    
    - **name**: Appraiser's full name
    - **bank_id**: Bank ID where appraiser should be registered
    - **branch_id**: Branch ID where appraiser should be registered
    
    Returns verification result and appraiser details if found
    """
    try:
        cursor = db.cursor()
        
        # Search for appraiser in the specified bank and branch
        cursor.execute("""
            SELECT ad.id, ad.appraiser_id, ad.name, ad.email, ad.phone, 
                   ad.bank_id, ad.branch_id, ad.created_at,
                   b.bank_name, br.branch_name
            FROM appraiser_details ad
            LEFT JOIN banks b ON ad.bank_id = b.id
            LEFT JOIN branches br ON ad.branch_id = br.id
            WHERE LOWER(ad.name) = LOWER(%s)
            AND ad.bank_id = %s
            AND ad.branch_id = %s
        """, (request.name.strip(), request.bank_id, request.branch_id))
        
        row = cursor.fetchone()
        cursor.close()
        
        if row:
            appraiser_data = {
                "id": row[0],
                "appraiser_id": row[1],
                "name": row[2],
                "email": row[3],
                "phone": row[4],
                "bank_id": row[5],
                "branch_id": row[6],
                "created_at": str(row[7]) if row[7] else None,
                "bank_name": row[8],
                "branch_name": row[9]
            }
            
            return AppraiserVerificationResponse(
                exists=True,
                message=f"Appraiser '{request.name}' is registered in {row[8]} - {row[9]}",
                appraiser=appraiser_data
            )
        else:
            return AppraiserVerificationResponse(
                exists=False,
                message=f"Appraiser '{request.name}' is not registered in the selected bank and branch. Only branch admin can add appraisers to this system."
            )
        
    except Exception as e:
        logger.error(f"Error verifying appraiser: {e}")
        raise HTTPException(status_code=500, detail=f"Error verifying appraiser: {str(e)}")