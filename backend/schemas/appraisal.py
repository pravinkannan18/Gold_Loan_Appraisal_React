"""
Appraisal/Session Schemas for Gold Loan Appraisal System

This module contains schemas for:
- Appraisal sessions and workflow
- Session status management
- Session data aggregation
- Session analytics and reporting
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

from .common import TimestampMixin, TenantMixin, GPSCoordinates, ImageUpload

# ============================================================================
# Session-specific Enums
# ============================================================================

class SessionStatus(str, Enum):
    """Session status enumeration"""
    CREATED = "created"
    IN_PROGRESS = "in_progress"
    APPRAISER_COMPLETED = "appraiser_completed"
    CUSTOMER_COMPLETED = "customer_completed"
    RBI_COMPLETED = "rbi_completed"
    PURITY_COMPLETED = "purity_completed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"
    REGISTERED = "registered"  # For appraiser registration sessions

class SessionType(str, Enum):
    """Type of appraisal session"""
    REGULAR_APPRAISAL = "regular_appraisal"
    QUICK_ASSESSMENT = "quick_assessment"
    DETAILED_EVALUATION = "detailed_evaluation"
    RE_APPRAISAL = "re_appraisal"
    TRAINING_SESSION = "training_session"

class SessionPriority(str, Enum):
    """Session priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

# ============================================================================
# Base Session Models
# ============================================================================

class SessionBase(BaseModel):
    """Base session model with common fields"""
    session_id: str = Field(..., description="Unique session identifier")
    status: SessionStatus = Field(SessionStatus.CREATED, description="Current session status")
    session_type: SessionType = Field(SessionType.REGULAR_APPRAISAL, description="Type of session")
    priority: SessionPriority = Field(SessionPriority.NORMAL, description="Session priority")

# ============================================================================
# Session Creation Models
# ============================================================================

class SessionMetadata(BaseModel):
    """Metadata for session tracking"""
    created_by_user_id: Optional[str] = None
    created_from_location: Optional[GPSCoordinates] = None
    device_info: Optional[Dict[str, str]] = Field(default_factory=dict)
    session_notes: Optional[str] = None
    estimated_duration: Optional[int] = Field(None, description="Estimated duration in minutes")
    tags: Optional[List[str]] = Field(default_factory=list)

class CustomerContext(BaseModel):
    """Customer context information"""
    customer_type: Optional[str] = Field(None, description="Type of customer (individual/business)")
    loan_purpose: Optional[str] = Field(None, description="Purpose of the loan")
    requested_amount: Optional[float] = Field(None, ge=0, description="Requested loan amount")
    customer_segment: Optional[str] = Field(None, description="Customer segment")
    risk_profile: Optional[str] = Field(None, description="Customer risk profile")

class SessionCreate(SessionBase, TenantMixin):
    """Schema for creating a new session"""
    session_metadata: Optional[SessionMetadata] = None
    customer_context: Optional[CustomerContext] = None

class SessionCreateRequest(BaseModel):
    """Request model for session creation"""
    bank_code: Optional[str] = Field(None, description="Bank code for session context")
    branch_code: Optional[str] = Field(None, description="Branch code for session context")
    user_id: Optional[str] = Field(None, description="User ID for appraiser context")
    session_type: SessionType = Field(SessionType.REGULAR_APPRAISAL)
    priority: SessionPriority = Field(SessionPriority.NORMAL)
    session_metadata: Optional[SessionMetadata] = None
    customer_context: Optional[CustomerContext] = None

# ============================================================================
# Session Update Models
# ============================================================================

class SessionStatusUpdate(BaseModel):
    """Model for updating session status"""
    status: SessionStatus
    status_reason: Optional[str] = Field(None, description="Reason for status change")
    updated_by: Optional[str] = Field(None, description="User who updated the status")
    additional_notes: Optional[str] = Field(None, description="Additional notes")

class SessionUpdate(BaseModel):
    """Schema for updating session information"""
    status: Optional[SessionStatus] = None
    priority: Optional[SessionPriority] = None
    session_metadata: Optional[SessionMetadata] = None
    customer_context: Optional[CustomerContext] = None

# ============================================================================
# Complete Session Model
# ============================================================================

class Session(SessionBase, TimestampMixin, TenantMixin):
    """Complete session model with all fields"""
    id: int
    session_metadata: Optional[SessionMetadata] = None
    customer_context: Optional[CustomerContext] = None
    
    # Workflow tracking
    workflow_stage: Optional[str] = Field(None, description="Current workflow stage")
    completion_percentage: Optional[float] = Field(None, ge=0, le=100, description="Session completion percentage")
    estimated_completion_time: Optional[datetime] = None
    actual_completion_time: Optional[datetime] = None
    
    # Legacy fields for backward compatibility
    name: Optional[str] = None
    bank: Optional[str] = None
    branch: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    appraiser_id: Optional[str] = None
    image_data: Optional[str] = None
    face_encoding: Optional[str] = None
    
    # Populated from joins (tenant context)
    bank_name: Optional[str] = None
    bank_code: Optional[str] = None
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    appraiser_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# Session Step/Stage Models
# ============================================================================

class SessionStep(BaseModel):
    """Individual step/stage within a session"""
    step_id: str = Field(..., description="Unique step identifier")
    step_name: str = Field(..., description="Human-readable step name")
    step_order: int = Field(..., ge=1, description="Order of this step in the workflow")
    status: str = Field("pending", description="Step status")
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration: Optional[float] = Field(None, description="Duration in minutes")
    data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Step-specific data")
    validation_errors: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = None

class SessionWorkflow(BaseModel):
    """Complete session workflow with all steps"""
    workflow_id: str = Field(..., description="Workflow identifier")
    workflow_name: str = Field(..., description="Workflow name")
    version: str = Field("1.0", description="Workflow version")
    steps: List[SessionStep] = Field(default_factory=list)
    current_step: Optional[str] = Field(None, description="Current active step")
    is_completed: bool = False
    completion_time: Optional[datetime] = None

# ============================================================================
# Session Data Models
# ============================================================================

class SessionDataSummary(BaseModel):
    """Summary of data collected in a session"""
    has_appraiser_data: bool = False
    has_customer_data: bool = False
    has_rbi_compliance_data: bool = False
    has_purity_data: bool = False
    total_images: int = 0
    total_items: int = 0
    data_quality_score: Optional[float] = Field(None, ge=0, le=100)

class SessionValidation(BaseModel):
    """Validation results for session data"""
    is_valid: bool
    validation_errors: List[str] = Field(default_factory=list)
    validation_warnings: List[str] = Field(default_factory=list)
    required_fields_missing: List[str] = Field(default_factory=list)
    data_quality_issues: List[str] = Field(default_factory=list)

# ============================================================================
# Session Query and Filter Models
# ============================================================================

class SessionSearchFilters(BaseModel):
    """Filters for searching sessions"""
    session_id_query: Optional[str] = Field(None, description="Search by session ID")
    status: Optional[List[SessionStatus]] = Field(None, description="Filter by status")
    session_type: Optional[List[SessionType]] = Field(None, description="Filter by session type")
    priority: Optional[List[SessionPriority]] = Field(None, description="Filter by priority")
    bank_id: Optional[int] = Field(None, description="Filter by bank")
    branch_id: Optional[int] = Field(None, description="Filter by branch")
    appraiser_id: Optional[str] = Field(None, description="Filter by appraiser")
    tenant_user_id: Optional[int] = Field(None, description="Filter by tenant user")
    created_after: Optional[datetime] = Field(None, description="Created after date")
    created_before: Optional[datetime] = Field(None, description="Created before date")
    completed_after: Optional[datetime] = Field(None, description="Completed after date")
    completed_before: Optional[datetime] = Field(None, description="Completed before date")
    has_customer_data: Optional[bool] = Field(None, description="Has customer data")
    has_purity_data: Optional[bool] = Field(None, description="Has purity test data")
    minimum_items: Optional[int] = Field(None, ge=0, description="Minimum number of items")

class SessionListResponse(BaseModel):
    """Response model for session list"""
    sessions: List[Session]
    total_count: int
    filtered_count: int
    page: int
    page_size: int
    filters_applied: Optional[SessionSearchFilters] = None
    aggregated_stats: Optional[Dict[str, Any]] = None

# ============================================================================
# Session Analytics Models
# ============================================================================

class SessionTimeAnalytics(BaseModel):
    """Time-based analytics for sessions"""
    average_duration: Optional[float] = Field(None, description="Average session duration in minutes")
    median_duration: Optional[float] = Field(None, description="Median session duration in minutes")
    fastest_session: Optional[float] = Field(None, description="Fastest session duration")
    slowest_session: Optional[float] = Field(None, description="Slowest session duration")
    total_time_spent: Optional[float] = Field(None, description="Total time spent in minutes")
    efficiency_score: Optional[float] = Field(None, ge=0, le=100, description="Efficiency score")

class SessionStatusAnalytics(BaseModel):
    """Status-based analytics for sessions"""
    status_distribution: Dict[SessionStatus, int] = Field(default_factory=dict)
    completion_rate: Optional[float] = Field(None, ge=0, le=100)
    cancellation_rate: Optional[float] = Field(None, ge=0, le=100)
    failure_rate: Optional[float] = Field(None, ge=0, le=100)
    average_steps_to_completion: Optional[float] = None

class SessionQualityMetrics(BaseModel):
    """Quality metrics for sessions"""
    data_completeness_score: Optional[float] = Field(None, ge=0, le=100)
    validation_pass_rate: Optional[float] = Field(None, ge=0, le=100)
    error_rate: Optional[float] = Field(None, ge=0, le=100)
    rework_rate: Optional[float] = Field(None, ge=0, le=100)
    customer_satisfaction: Optional[float] = Field(None, ge=1, le=5)

class SessionAnalyticsReport(BaseModel):
    """Comprehensive session analytics report"""
    report_period_start: datetime
    report_period_end: datetime
    total_sessions: int
    
    # Analytics breakdown
    time_analytics: SessionTimeAnalytics
    status_analytics: SessionStatusAnalytics
    quality_metrics: SessionQualityMetrics
    
    # Trends and patterns
    daily_session_counts: Dict[str, int] = Field(default_factory=dict)
    peak_hours: List[int] = Field(default_factory=list)
    busiest_days: List[str] = Field(default_factory=list)
    
    # Performance insights
    top_performing_appraisers: List[Dict[str, Any]] = Field(default_factory=list)
    bottleneck_stages: List[str] = Field(default_factory=list)
    improvement_recommendations: List[str] = Field(default_factory=list)

# ============================================================================
# Session Export Models
# ============================================================================

class SessionExportRequest(BaseModel):
    """Request model for exporting session data"""
    filters: Optional[SessionSearchFilters] = None
    export_format: str = Field("json", pattern="^(json|csv|excel|pdf)$")
    include_images: bool = Field(False, description="Include image data in export")
    include_analytics: bool = Field(True, description="Include analytics in export")
    fields_to_include: Optional[List[str]] = Field(None, description="Specific fields to include")
    date_format: str = Field("ISO", description="Date format for export")

class SessionExportResponse(BaseModel):
    """Response model for session export"""
    export_id: str
    export_format: str
    file_path: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    record_count: int
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None

# ============================================================================
# Session Bulk Operations
# ============================================================================

class SessionBulkAction(BaseModel):
    """Model for bulk operations on sessions"""
    session_ids: List[str] = Field(..., description="List of session IDs")
    action: str = Field(..., description="Action to perform")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    reason: Optional[str] = Field(None, description="Reason for bulk action")
    force_action: bool = Field(False, description="Force action even if some sessions fail")

class SessionBulkActionResult(BaseModel):
    """Result of bulk action on sessions"""
    total_requested: int
    successful: int
    failed: int
    skipped: int
    successful_session_ids: List[str] = Field(default_factory=list)
    failed_session_ids: List[str] = Field(default_factory=list)
    error_details: Dict[str, str] = Field(default_factory=dict)
    execution_time: Optional[float] = None