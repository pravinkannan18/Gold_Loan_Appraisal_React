"""
Customer Schemas for Gold Loan Appraisal System

This module contains schemas for:
- Customer information and profiles
- Customer document management
- Customer verification and KYC
- Customer interactions and feedback
"""

from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

from .common import TimestampMixin, TenantMixin, AddressInfo, ContactInfo, ValidationHelpers, ImageUpload

# ============================================================================
# Customer-specific Enums
# ============================================================================

class CustomerType(str, Enum):
    """Type of customer"""
    INDIVIDUAL = "individual"
    BUSINESS = "business"
    CORPORATE = "corporate"
    PARTNERSHIP = "partnership"
    TRUST = "trust"
    SOCIETY = "society"

class IdentificationDocumentType(str, Enum):
    """Types of identification documents"""
    AADHAAR = "aadhaar"
    PAN_CARD = "pan_card"
    PASSPORT = "passport"
    VOTER_ID = "voter_id"
    DRIVING_LICENSE = "driving_license"
    RATION_CARD = "ration_card"
    BANK_PASSBOOK = "bank_passbook"
    UTILITY_BILL = "utility_bill"

class CustomerStatus(str, Enum):
    """Customer status in the system"""
    NEW = "new"
    VERIFIED = "verified"
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"
    SUSPENDED = "suspended"

class KYCStatus(str, Enum):
    """KYC verification status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"
    EXPIRED = "expired"

class RiskProfile(str, Enum):
    """Customer risk profiling"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

# ============================================================================
# Customer Identity Models
# ============================================================================

class IdentificationDocument(BaseModel):
    """Model for customer identification documents"""
    document_type: IdentificationDocumentType
    document_number: str = Field(..., min_length=1, max_length=50)
    document_name: Optional[str] = Field(None, description="Name as per document")
    issuing_authority: Optional[str] = Field(None, description="Document issuing authority")
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    document_image_front: Optional[str] = Field(None, description="Base64 encoded front image")
    document_image_back: Optional[str] = Field(None, description="Base64 encoded back image")
    is_verified: bool = Field(False, description="Whether document is verified")
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = Field(None, description="Who verified the document")

class CustomerIdentity(BaseModel):
    """Core customer identity information"""
    first_name: str = Field(..., min_length=1, max_length=100)
    middle_name: Optional[str] = Field(None, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    full_name: Optional[str] = Field(None, description="Auto-computed full name")
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other|prefer_not_to_say)$")
    nationality: Optional[str] = Field(None, max_length=50)
    
    # Father/Spouse details for KYC
    father_name: Optional[str] = Field(None, max_length=200)
    spouse_name: Optional[str] = Field(None, max_length=200)
    
    @validator('full_name', always=True)
    def compute_full_name(cls, v, values):
        if not v:
            first = values.get('first_name', '')
            middle = values.get('middle_name', '')
            last = values.get('last_name', '')
            parts = [first, middle, last]
            return ' '.join(filter(None, parts))
        return v

# ============================================================================
# Customer Base Models
# ============================================================================

class CustomerBase(BaseModel):
    """Base customer model with essential fields"""
    customer_id: Optional[str] = Field(None, max_length=100, description="External customer ID")
    customer_type: CustomerType = CustomerType.INDIVIDUAL
    identity: CustomerIdentity
    contact_info: Optional[ContactInfo] = None
    address: Optional[AddressInfo] = None

# ============================================================================
# Customer Profile Models
# ============================================================================

class CustomerFinancialProfile(BaseModel):
    """Customer financial information"""
    annual_income: Optional[float] = Field(None, ge=0, description="Annual income")
    monthly_income: Optional[float] = Field(None, ge=0, description="Monthly income")
    occupation: Optional[str] = Field(None, max_length=100)
    employer_name: Optional[str] = Field(None, max_length=200)
    employment_type: Optional[str] = Field(None, pattern="^(salaried|self_employed|business|retired|student|unemployed)$")
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    bank_account_details: Optional[Dict[str, str]] = Field(default_factory=dict)
    credit_score: Optional[int] = Field(None, ge=300, le=900)
    existing_loans: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class CustomerKYC(BaseModel):
    """Customer KYC information"""
    kyc_status: KYCStatus = KYCStatus.PENDING
    risk_profile: Optional[RiskProfile] = None
    identification_documents: List[IdentificationDocument] = Field(default_factory=list)
    kyc_completed_date: Optional[datetime] = None
    kyc_expiry_date: Optional[datetime] = None
    kyc_verified_by: Optional[str] = None
    kyc_notes: Optional[str] = None
    aml_checked: bool = Field(False, description="Anti-Money Laundering check completed")
    aml_clear: Optional[bool] = Field(None, description="AML check result")
    pep_status: Optional[bool] = Field(None, description="Politically Exposed Person status")

class CustomerProfile(CustomerBase, TimestampMixin, TenantMixin):
    """Complete customer profile"""
    id: int
    customer_status: CustomerStatus = CustomerStatus.NEW
    
    # Enhanced profile information
    financial_profile: Optional[CustomerFinancialProfile] = None
    kyc_information: Optional[CustomerKYC] = None
    
    # Images and biometrics
    profile_image: Optional[str] = Field(None, description="Base64 encoded profile image")
    signature_image: Optional[str] = Field(None, description="Base64 encoded signature")
    biometric_data: Optional[Dict[str, str]] = Field(default_factory=dict)
    
    # Interaction history
    first_interaction_date: Optional[datetime] = None
    last_interaction_date: Optional[datetime] = None
    total_interactions: int = Field(0, description="Total number of interactions")
    
    # Preferences and settings
    communication_preferences: Optional[Dict[str, bool]] = Field(default_factory=dict)
    language_preference: Optional[str] = Field("english", max_length=50)
    
    # Relationship management
    relationship_manager: Optional[str] = Field(None, description="Assigned relationship manager")
    customer_segment: Optional[str] = Field(None, description="Customer segment")
    acquisition_channel: Optional[str] = Field(None, description="How customer was acquired")
    
    class Config:
        from_attributes = True

# ============================================================================
# Customer Session Data Models
# ============================================================================

class CustomerSessionData(BaseModel):
    """Customer data captured during appraisal session"""
    customer_front_image: Optional[str] = Field(None, description="Front facing photo of customer")
    customer_side_image: Optional[str] = Field(None, description="Side profile photo")
    additional_images: Optional[List[str]] = Field(default_factory=list, description="Additional customer images")
    
    # Basic information collected during session
    session_customer_name: Optional[str] = Field(None, description="Customer name as provided in session")
    session_customer_phone: Optional[str] = Field(None, description="Phone number provided in session")
    session_customer_address: Optional[str] = Field(None, description="Address provided in session")
    
    # Document verification during session
    documents_presented: Optional[List[IdentificationDocument]] = Field(default_factory=list)
    document_verification_status: Optional[str] = Field(None)
    
    # Consent and agreements
    photo_consent_given: bool = Field(False, description="Consent for photography")
    data_processing_consent: bool = Field(False, description="Consent for data processing")
    terms_accepted: bool = Field(False, description="Terms and conditions accepted")
    consent_timestamp: Optional[datetime] = None
    
    @validator('session_customer_phone')
    def validate_phone(cls, v):
        if v:
            return ValidationHelpers.validate_phone_number(v)
        return v

# ============================================================================
# Customer Interaction Models
# ============================================================================

class CustomerInteraction(BaseModel):
    """Model for customer interactions"""
    interaction_id: str = Field(..., description="Unique interaction identifier")
    interaction_type: str = Field(..., description="Type of interaction")
    interaction_channel: str = Field(..., description="Channel of interaction (phone, email, in-person, etc.)")
    interaction_date: datetime = Field(default_factory=datetime.now)
    interaction_duration: Optional[int] = Field(None, description="Duration in minutes")
    
    # Interaction details
    summary: Optional[str] = Field(None, description="Summary of interaction")
    details: Optional[str] = Field(None, description="Detailed notes")
    outcome: Optional[str] = Field(None, description="Interaction outcome")
    follow_up_required: bool = Field(False)
    follow_up_date: Optional[datetime] = None
    
    # Staff information
    handled_by: Optional[str] = Field(None, description="Staff member who handled interaction")
    handled_by_role: Optional[str] = Field(None, description="Role of staff member")
    
    # Quality and feedback
    customer_satisfaction: Optional[int] = Field(None, ge=1, le=5, description="Customer satisfaction rating")
    interaction_rating: Optional[int] = Field(None, ge=1, le=5, description="Quality rating of interaction")

class CustomerFeedback(BaseModel):
    """Customer feedback model"""
    feedback_id: str = Field(..., description="Unique feedback identifier")
    feedback_type: str = Field(..., description="Type of feedback")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Overall rating")
    
    # Detailed ratings
    service_quality_rating: Optional[int] = Field(None, ge=1, le=5)
    staff_behavior_rating: Optional[int] = Field(None, ge=1, le=5)
    process_efficiency_rating: Optional[int] = Field(None, ge=1, le=5)
    facility_rating: Optional[int] = Field(None, ge=1, le=5)
    
    # Comments and suggestions
    positive_feedback: Optional[str] = None
    negative_feedback: Optional[str] = None
    suggestions: Optional[str] = None
    
    # Metadata
    feedback_date: datetime = Field(default_factory=datetime.now)
    feedback_channel: Optional[str] = None
    is_anonymous: bool = Field(False)

# ============================================================================
# Customer Search and Management Models
# ============================================================================

class CustomerSearchFilters(BaseModel):
    """Filters for searching customers"""
    name_query: Optional[str] = Field(None, description="Search by name")
    customer_id_query: Optional[str] = Field(None, description="Search by customer ID")
    phone_query: Optional[str] = Field(None, description="Search by phone number")
    email_query: Optional[str] = Field(None, description="Search by email")
    document_number_query: Optional[str] = Field(None, description="Search by document number")
    
    # Filter criteria
    customer_type: Optional[CustomerType] = None
    customer_status: Optional[List[CustomerStatus]] = None
    kyc_status: Optional[List[KYCStatus]] = None
    risk_profile: Optional[List[RiskProfile]] = None
    bank_id: Optional[int] = None
    branch_id: Optional[int] = None
    
    # Date filters
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    last_interaction_after: Optional[datetime] = None
    last_interaction_before: Optional[datetime] = None
    
    # Other filters
    has_active_loans: Optional[bool] = None
    min_annual_income: Optional[float] = None
    max_annual_income: Optional[float] = None

class CustomerListResponse(BaseModel):
    """Response model for customer list"""
    customers: List[CustomerProfile]
    total_count: int
    filtered_count: int
    page: int
    page_size: int
    filters_applied: Optional[CustomerSearchFilters] = None

# ============================================================================
# Customer Analytics Models
# ============================================================================

class CustomerAnalytics(BaseModel):
    """Customer analytics and insights"""
    total_customers: int
    new_customers_this_month: int
    active_customers: int
    customer_growth_rate: Optional[float] = None
    
    # Segmentation
    customer_type_distribution: Dict[CustomerType, int] = Field(default_factory=dict)
    risk_profile_distribution: Dict[RiskProfile, int] = Field(default_factory=dict)
    age_group_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # Geographic distribution
    city_wise_distribution: Dict[str, int] = Field(default_factory=dict)
    state_wise_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # Behavioral insights
    average_loan_amount: Optional[float] = None
    repeat_customer_rate: Optional[float] = None
    customer_satisfaction_average: Optional[float] = None
    
    # KYC and compliance
    kyc_completion_rate: Optional[float] = None
    document_verification_rate: Optional[float] = None
    aml_clear_rate: Optional[float] = None

# ============================================================================
# Customer Document Upload Models
# ============================================================================

class CustomerDocumentUploadRequest(BaseModel):
    """Request for uploading customer documents"""
    customer_id: Optional[int] = None
    session_id: Optional[str] = None
    document_type: IdentificationDocumentType
    document_number: str
    document_front_image: ImageUpload
    document_back_image: Optional[ImageUpload] = None
    auto_extract_data: bool = Field(True, description="Auto-extract data from document")

class CustomerDocumentUploadResponse(BaseModel):
    """Response for document upload"""
    success: bool
    document_id: str
    extracted_data: Optional[Dict[str, Any]] = None
    verification_status: str
    confidence_score: Optional[float] = None
    processing_time: Optional[float] = None

# ============================================================================
# Customer Bulk Operations
# ============================================================================

class CustomerBulkAction(BaseModel):
    """Bulk operations on customers"""
    customer_ids: List[int] = Field(..., description="List of customer IDs")
    action: str = Field(..., description="Action to perform")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    reason: Optional[str] = None

class CustomerImportRequest(BaseModel):
    """Request for importing customer data"""
    file_format: str = Field(..., pattern="^(csv|excel|json)$")
    file_data: str = Field(..., description="Base64 encoded file data")
    mapping_config: Optional[Dict[str, str]] = Field(None, description="Field mapping configuration")
    validation_strict: bool = Field(True, description="Strict validation mode")
    auto_create_missing_references: bool = Field(False, description="Auto-create missing bank/branch references")