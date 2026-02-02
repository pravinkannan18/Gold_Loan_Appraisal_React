"""
Appraiser Schemas for Gold Loan Appraisal System

This module contains schemas for:
- Appraiser registration and management
- Facial recognition data
- Authentication and authorization
- Appraiser performance tracking
"""

from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from .common import TimestampMixin, TenantMixin, ContactInfo, ImageUpload, ValidationHelpers
from .tenant import UserRole, UserPermissions

# ============================================================================
# Appraiser-specific Enums
# ============================================================================

class AppraiserStatus(str, Enum):
    """Appraiser status in the system"""
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    TRAINING = "training"
    PROBATION = "probation"

class CertificationLevel(str, Enum):
    """Appraiser certification levels"""
    TRAINEE = "trainee"
    CERTIFIED = "certified"
    SENIOR_CERTIFIED = "senior_certified"
    EXPERT = "expert"
    MASTER = "master"

class AuthenticationMethod(str, Enum):
    """Authentication methods for appraisers"""
    FACE_RECOGNITION = "face_recognition"
    PIN = "pin"
    BIOMETRIC = "biometric"
    OTP = "otp"
    PASSWORD = "password"

# ============================================================================
# Base Appraiser Models
# ============================================================================

class AppraiserBase(BaseModel):
    """Base appraiser model with common fields"""
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the appraiser")
    appraiser_id: str = Field(..., min_length=1, max_length=50, description="Unique appraiser identifier")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    employee_id: Optional[str] = Field(None, max_length=50, description="Employee ID")
    designation: Optional[str] = Field(None, max_length=100, description="Job designation")
    
    @validator('appraiser_id')
    def validate_appraiser_id(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Appraiser ID must be alphanumeric (underscores and hyphens allowed)')
        return v.upper()
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            return ValidationHelpers.validate_phone_number(v)
        return v

# ============================================================================
# Facial Recognition Models
# ============================================================================

class FaceEncodingData(BaseModel):
    """Model for facial recognition encoding data"""
    encoding_data: str = Field(..., description="Base64 encoded face embedding")
    encoding_version: str = Field("1.0", description="Version of encoding algorithm")
    confidence_score: Optional[float] = Field(None, ge=0, le=1, description="Confidence score of encoding")
    image_quality_score: Optional[float] = Field(None, ge=0, le=1, description="Quality score of source image")
    created_at: datetime = Field(default_factory=datetime.now)

class FaceRecognitionResult(BaseModel):
    """Model for face recognition match results"""
    matched: bool = Field(..., description="Whether face was successfully matched")
    confidence: float = Field(..., ge=0, le=1, description="Matching confidence score")
    appraiser_id: Optional[str] = Field(None, description="Matched appraiser ID")
    appraiser_name: Optional[str] = Field(None, description="Matched appraiser name")
    threshold_met: bool = Field(..., description="Whether confidence meets minimum threshold")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")

# ============================================================================
# Appraiser Registration Models
# ============================================================================

class AppraiserRegistrationData(AppraiserBase):
    """Data required for appraiser registration"""
    bank: Optional[str] = Field(None, description="Bank name (legacy field)")
    branch: Optional[str] = Field(None, description="Branch name (legacy field)")
    image: Optional[str] = Field(None, description="Base64 encoded profile image")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)
    
    # New tenant hierarchy fields
    bank_id: Optional[int] = Field(None, description="Bank ID from tenant hierarchy")
    branch_id: Optional[int] = Field(None, description="Branch ID from tenant hierarchy")
    tenant_user_id: Optional[int] = Field(None, description="Tenant user ID")

class AppraiserRegistrationRequest(BaseModel):
    """Request model for appraiser registration"""
    appraiser_data: AppraiserRegistrationData
    face_image: ImageUpload
    authentication_methods: List[AuthenticationMethod] = Field(
        default=[AuthenticationMethod.FACE_RECOGNITION],
        description="Preferred authentication methods"
    )
    certification_level: CertificationLevel = Field(
        CertificationLevel.TRAINEE,
        description="Initial certification level"
    )
    auto_activate: bool = Field(True, description="Automatically activate after registration")

class AppraiserRegistrationResponse(BaseModel):
    """Response model for appraiser registration"""
    success: bool
    message: str
    appraiser_id: Optional[str] = None
    registration_id: Optional[int] = None
    face_encoding_created: bool = False
    tenant_user_created: bool = False
    activation_required: bool = False

# ============================================================================
# Authentication Models
# ============================================================================

class AppraiserAuthenticationRequest(BaseModel):
    """Request model for appraiser authentication"""
    appraiser_id: Optional[str] = Field(None, description="Appraiser ID")
    authentication_method: AuthenticationMethod
    face_image: Optional[str] = Field(None, description="Base64 encoded face image for recognition")
    pin: Optional[str] = Field(None, min_length=4, max_length=8, description="PIN for authentication")
    otp: Optional[str] = Field(None, min_length=4, max_length=8, description="OTP for authentication")
    bank_code: Optional[str] = Field(None, description="Bank context for authentication")
    branch_code: Optional[str] = Field(None, description="Branch context for authentication")

class AppraiserAuthenticationResponse(BaseModel):
    """Response model for appraiser authentication"""
    authenticated: bool
    appraiser_info: Optional[Dict[str, Any]] = None
    tenant_context: Optional[Dict[str, Any]] = None
    session_token: Optional[str] = None
    authentication_method_used: Optional[AuthenticationMethod] = None
    face_recognition_result: Optional[FaceRecognitionResult] = None
    message: str = "Authentication successful"

# ============================================================================
# Appraiser Profile Models
# ============================================================================

class AppraiserCertification(BaseModel):
    """Model for appraiser certifications"""
    certification_name: str = Field(..., description="Name of certification")
    certification_level: CertificationLevel
    issued_by: str = Field(..., description="Issuing authority")
    issued_date: datetime
    expiry_date: Optional[datetime] = None
    certificate_number: Optional[str] = None
    is_active: bool = True

class AppraiserTraining(BaseModel):
    """Model for appraiser training records"""
    training_name: str = Field(..., description="Training program name")
    training_provider: str = Field(..., description="Training provider")
    completion_date: datetime
    duration_hours: Optional[int] = Field(None, description="Training duration in hours")
    score: Optional[float] = Field(None, ge=0, le=100, description="Training score")
    certificate_path: Optional[str] = Field(None, description="Path to certificate file")

class AppraiserPerformanceMetrics(BaseModel):
    """Model for appraiser performance tracking"""
    total_appraisals: int = Field(0, description="Total number of appraisals completed")
    total_items_appraised: int = Field(0, description="Total items appraised")
    average_accuracy: Optional[float] = Field(None, ge=0, le=100, description="Average accuracy percentage")
    average_time_per_appraisal: Optional[float] = Field(None, description="Average time per appraisal in minutes")
    customer_satisfaction_rating: Optional[float] = Field(None, ge=1, le=5, description="Average customer rating")
    last_appraisal_date: Optional[datetime] = None
    performance_period_start: datetime = Field(default_factory=datetime.now)
    performance_period_end: Optional[datetime] = None

class AppraiserProfile(AppraiserBase, TimestampMixin, TenantMixin):
    """Complete appraiser profile model"""
    id: int
    status: AppraiserStatus = AppraiserStatus.PENDING_VERIFICATION
    certification_level: CertificationLevel = CertificationLevel.TRAINEE
    
    # Authentication and security
    face_encoding: Optional[str] = None
    profile_image: Optional[str] = None
    authentication_methods: List[AuthenticationMethod] = Field(default_factory=list)
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    account_locked_until: Optional[datetime] = None
    
    # Professional information
    certifications: List[AppraiserCertification] = Field(default_factory=list)
    training_records: List[AppraiserTraining] = Field(default_factory=list)
    permissions: Optional[UserPermissions] = None
    
    # Performance tracking
    performance_metrics: Optional[AppraiserPerformanceMetrics] = None
    
    # Legacy fields for compatibility
    bank: Optional[str] = None
    branch: Optional[str] = None
    
    # Tenant context (populated from joins)
    bank_name: Optional[str] = None
    bank_code: Optional[str] = None
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# Appraiser Management Models
# ============================================================================

class AppraiserStatusUpdate(BaseModel):
    """Model for updating appraiser status"""
    status: AppraiserStatus
    reason: Optional[str] = Field(None, description="Reason for status change")
    effective_date: datetime = Field(default_factory=datetime.now)
    updated_by: Optional[str] = Field(None, description="User who updated the status")

class AppraiserBulkAction(BaseModel):
    """Model for bulk actions on appraisers"""
    appraiser_ids: List[str] = Field(..., description="List of appraiser IDs")
    action: str = Field(..., description="Action to perform")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Action parameters")
    reason: Optional[str] = Field(None, description="Reason for bulk action")

# ============================================================================
# Search and Filter Models
# ============================================================================

class AppraiserSearchFilters(BaseModel):
    """Filters for searching appraisers"""
    name_query: Optional[str] = Field(None, description="Search by name")
    appraiser_id_query: Optional[str] = Field(None, description="Search by appraiser ID")
    status: Optional[AppraiserStatus] = Field(None, description="Filter by status")
    certification_level: Optional[CertificationLevel] = Field(None, description="Filter by certification level")
    bank_id: Optional[int] = Field(None, description="Filter by bank")
    branch_id: Optional[int] = Field(None, description="Filter by branch")
    user_role: Optional[UserRole] = Field(None, description="Filter by user role")
    created_after: Optional[datetime] = Field(None, description="Created after date")
    created_before: Optional[datetime] = Field(None, description="Created before date")
    last_login_after: Optional[datetime] = Field(None, description="Last login after date")
    has_face_encoding: Optional[bool] = Field(None, description="Has face recognition setup")

class AppraiserListResponse(BaseModel):
    """Response model for appraiser list"""
    appraisers: List[AppraiserProfile]
    total_count: int
    filtered_count: int
    page: int
    page_size: int
    filters_applied: AppraiserSearchFilters

# ============================================================================
# Reporting Models
# ============================================================================

class AppraiserReportSummary(BaseModel):
    """Summary report for appraiser activities"""
    appraiser_id: str
    appraiser_name: str
    report_period_start: datetime
    report_period_end: datetime
    
    # Activity metrics
    total_sessions: int
    completed_sessions: int
    cancelled_sessions: int
    average_session_duration: Optional[float] = None
    
    # Performance metrics
    total_items_appraised: int
    accuracy_score: Optional[float] = None
    customer_ratings: List[float] = Field(default_factory=list)
    average_customer_rating: Optional[float] = None
    
    # Time tracking
    total_working_hours: Optional[float] = None
    productive_hours: Optional[float] = None
    efficiency_percentage: Optional[float] = None

class TeamPerformanceReport(BaseModel):
    """Performance report for a team/branch"""
    bank_name: str
    branch_name: Optional[str] = None
    report_period_start: datetime
    report_period_end: datetime
    
    # Team metrics
    total_appraisers: int
    active_appraisers: int
    team_performance_score: Optional[float] = None
    
    # Individual summaries
    appraiser_reports: List[AppraiserReportSummary] = Field(default_factory=list)
    
    # Aggregated metrics
    total_team_sessions: int
    total_team_items: int
    average_team_accuracy: Optional[float] = None
    best_performer: Optional[str] = None
    improvement_areas: List[str] = Field(default_factory=list)