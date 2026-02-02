"""
RBI Compliance Schemas for Gold Loan Appraisal System

This module contains schemas for:
- RBI regulatory compliance requirements
- Documentation and audit trails
- Compliance checklists and validations
- Regulatory reporting
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

from .common import TimestampMixin, TenantMixin, GPSCoordinates, ImageUpload

# ============================================================================
# RBI Compliance Enums
# ============================================================================

class ComplianceStatus(str, Enum):
    """Compliance verification status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    REQUIRES_REVIEW = "requires_review"

class ComplianceCategory(str, Enum):
    """Categories of RBI compliance"""
    KYC_REQUIREMENTS = "kyc_requirements"
    LOAN_TO_VALUE_RATIO = "loan_to_value_ratio"
    DOCUMENTATION = "documentation"
    VALUATION_STANDARDS = "valuation_standards"
    INTEREST_RATE_GUIDELINES = "interest_rate_guidelines"
    OPERATIONAL_GUIDELINES = "operational_guidelines"
    REPORTING_REQUIREMENTS = "reporting_requirements"
    AUDIT_REQUIREMENTS = "audit_requirements"

class RegulatoryFramework(str, Enum):
    """Applicable regulatory frameworks"""
    RBI_MASTER_CIRCULAR = "rbi_master_circular"
    PMLA_REQUIREMENTS = "pmla_requirements"
    NBFC_GUIDELINES = "nbfc_guidelines"
    BANKING_REGULATION = "banking_regulation"
    FAIR_PRACTICES_CODE = "fair_practices_code"

class ComplianceCheckType(str, Enum):
    """Types of compliance checks"""
    MANDATORY = "mandatory"
    RECOMMENDED = "recommended"
    CONDITIONAL = "conditional"
    OPTIONAL = "optional"

# ============================================================================
# Compliance Item Models
# ============================================================================

class ComplianceItem(BaseModel):
    """Individual compliance requirement item"""
    item_id: str = Field(..., description="Unique compliance item identifier")
    item_name: str = Field(..., description="Name of compliance requirement")
    description: str = Field(..., description="Detailed description of requirement")
    category: ComplianceCategory
    regulatory_framework: RegulatoryFramework
    check_type: ComplianceCheckType
    
    # Compliance criteria
    acceptance_criteria: str = Field(..., description="Criteria for compliance")
    validation_rules: Optional[Dict[str, Any]] = Field(default_factory=dict)
    reference_documents: Optional[List[str]] = Field(default_factory=list)
    
    # Status and verification
    status: ComplianceStatus = ComplianceStatus.PENDING
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    verification_notes: Optional[str] = None
    
    # Evidence and documentation
    supporting_documents: Optional[List[str]] = Field(default_factory=list)
    evidence_images: Optional[List[str]] = Field(default_factory=list)
    compliance_score: Optional[float] = Field(None, ge=0, le=100)

# ============================================================================
# RBI Compliance Checklist Models
# ============================================================================

class ComplianceChecklist(BaseModel):
    """Complete RBI compliance checklist"""
    checklist_id: str = Field(..., description="Unique checklist identifier")
    checklist_version: str = Field("1.0", description="Version of compliance checklist")
    applicable_date: date = Field(..., description="Date from which checklist is applicable")
    
    # Checklist items organized by category
    kyc_requirements: List[ComplianceItem] = Field(default_factory=list)
    documentation_requirements: List[ComplianceItem] = Field(default_factory=list)
    valuation_requirements: List[ComplianceItem] = Field(default_factory=list)
    operational_requirements: List[ComplianceItem] = Field(default_factory=list)
    reporting_requirements: List[ComplianceItem] = Field(default_factory=list)
    
    # Overall compliance status
    overall_status: ComplianceStatus = ComplianceStatus.PENDING
    completion_percentage: float = Field(0, ge=0, le=100)
    mandatory_items_completed: int = 0
    total_mandatory_items: int = 0
    
    # Audit information
    last_reviewed_at: Optional[datetime] = None
    last_reviewed_by: Optional[str] = None
    next_review_due: Optional[datetime] = None

# ============================================================================
# RBI Compliance Data Models
# ============================================================================

class RBIComplianceBase(BaseModel):
    """Base RBI compliance data"""
    total_items: int = Field(0, ge=0, description="Total number of jewelry items")
    overall_images: Optional[List[str]] = Field(default_factory=list, description="Overall jewelry images")
    item_images: Optional[List[str]] = Field(default_factory=list, description="Individual item images")
    gps_coordinates: Optional[GPSCoordinates] = Field(None, description="Location verification")

class JewelryItemCompliance(BaseModel):
    """Compliance data for individual jewelry items"""
    item_id: str = Field(..., description="Unique item identifier")
    item_type: str = Field(..., description="Type of jewelry item")
    weight: Optional[float] = Field(None, ge=0, description="Weight in grams")
    purity: Optional[float] = Field(None, ge=0, le=24, description="Gold purity in karats")
    estimated_value: Optional[float] = Field(None, ge=0, description="Estimated value")
    
    # Compliance specific fields
    hallmark_present: Optional[bool] = Field(None, description="Whether item has hallmark")
    hallmark_details: Optional[str] = Field(None, description="Hallmark certification details")
    item_condition: Optional[str] = Field(None, description="Physical condition of item")
    valuation_method: Optional[str] = Field(None, description="Method used for valuation")
    
    # Images and documentation
    item_images: List[str] = Field(default_factory=list, description="Images of the item")
    hallmark_images: Optional[List[str]] = Field(default_factory=list, description="Hallmark close-up images")
    
    # Compliance checks
    compliance_items: List[ComplianceItem] = Field(default_factory=list)
    compliance_status: ComplianceStatus = ComplianceStatus.PENDING

class RBIComplianceData(RBIComplianceBase, TimestampMixin, TenantMixin):
    """Complete RBI compliance data model"""
    id: int
    session_id: str = Field(..., description="Associated session ID")
    
    # Enhanced compliance information
    compliance_checklist: ComplianceChecklist
    individual_items: List[JewelryItemCompliance] = Field(default_factory=list)
    
    # Location and verification
    verification_location: Optional[GPSCoordinates] = None
    location_verified: bool = Field(False, description="Whether location is verified")
    location_variance: Optional[float] = Field(None, description="Distance variance from expected location in meters")
    
    # Regulatory notes and observations
    regulatory_notes: Optional[str] = Field(None, description="Regulatory compliance notes")
    auditor_observations: Optional[str] = Field(None, description="Auditor observations")
    compliance_officer_remarks: Optional[str] = Field(None, description="Compliance officer remarks")
    
    # Risk assessment
    compliance_risk_score: Optional[float] = Field(None, ge=0, le=100, description="Compliance risk score")
    risk_factors: Optional[List[str]] = Field(default_factory=list, description="Identified risk factors")
    mitigation_measures: Optional[List[str]] = Field(default_factory=list, description="Risk mitigation measures")
    
    # Approval workflow
    requires_approval: bool = Field(False, description="Whether compliance requires senior approval")
    approved_by: Optional[str] = Field(None, description="Approved by (senior officer)")
    approval_date: Optional[datetime] = None
    approval_comments: Optional[str] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# Compliance Validation Models
# ============================================================================

class ComplianceValidationRule(BaseModel):
    """Rule for validating compliance"""
    rule_id: str = Field(..., description="Unique rule identifier")
    rule_name: str = Field(..., description="Name of the validation rule")
    rule_type: str = Field(..., description="Type of validation rule")
    category: ComplianceCategory
    
    # Rule definition
    rule_expression: str = Field(..., description="Rule logic expression")
    error_message: str = Field(..., description="Error message when rule fails")
    warning_message: Optional[str] = Field(None, description="Warning message for partial compliance")
    
    # Rule metadata
    is_mandatory: bool = Field(True, description="Whether rule is mandatory")
    weight: float = Field(1.0, ge=0, description="Weight of rule in overall compliance score")
    applicable_contexts: List[str] = Field(default_factory=list)

class ComplianceValidationResult(BaseModel):
    """Result of compliance validation"""
    rule_id: str
    rule_name: str
    passed: bool
    score: float = Field(..., ge=0, le=100)
    
    # Validation details
    actual_value: Optional[Any] = None
    expected_value: Optional[Any] = None
    error_message: Optional[str] = None
    warning_message: Optional[str] = None
    
    # Recommendations
    remediation_steps: Optional[List[str]] = Field(default_factory=list)
    priority: str = Field("medium", pattern="^(low|medium|high|critical)$")

class ComplianceValidationReport(BaseModel):
    """Complete compliance validation report"""
    session_id: str
    validation_timestamp: datetime = Field(default_factory=datetime.now)
    overall_compliance_score: float = Field(..., ge=0, le=100)
    
    # Validation results by category
    kyc_results: List[ComplianceValidationResult] = Field(default_factory=list)
    documentation_results: List[ComplianceValidationResult] = Field(default_factory=list)
    valuation_results: List[ComplianceValidationResult] = Field(default_factory=list)
    operational_results: List[ComplianceValidationResult] = Field(default_factory=list)
    
    # Summary
    total_rules_evaluated: int
    rules_passed: int
    rules_failed: int
    rules_with_warnings: int
    
    # Recommendations and actions
    critical_issues: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    compliance_certified: bool = Field(False)
    certification_date: Optional[datetime] = None
    certified_by: Optional[str] = None

# ============================================================================
# RBI Reporting Models
# ============================================================================

class RegulatoryReport(BaseModel):
    """Model for regulatory reporting"""
    report_id: str = Field(..., description="Unique report identifier")
    report_type: str = Field(..., description="Type of regulatory report")
    reporting_period_start: date
    reporting_period_end: date
    
    # Report metadata
    generated_at: datetime = Field(default_factory=datetime.now)
    generated_by: str = Field(..., description="User who generated the report")
    bank_id: int = Field(..., description="Bank for which report is generated")
    
    # Compliance summary
    total_appraisals: int
    compliant_appraisals: int
    non_compliant_appraisals: int
    compliance_percentage: float = Field(..., ge=0, le=100)
    
    # Detailed metrics
    average_loan_to_value_ratio: Optional[float] = None
    total_loan_amount: Optional[float] = None
    average_item_value: Optional[float] = None
    
    # Issues and observations
    compliance_violations: List[Dict[str, Any]] = Field(default_factory=list)
    regulatory_observations: List[str] = Field(default_factory=list)
    corrective_actions_taken: List[str] = Field(default_factory=list)
    
    # Approval and submission
    approved_by: Optional[str] = None
    approval_date: Optional[datetime] = None
    submitted_to_regulator: bool = Field(False)
    submission_date: Optional[datetime] = None
    acknowledgment_number: Optional[str] = None

# ============================================================================
# Compliance Search and Filter Models
# ============================================================================

class ComplianceSearchFilters(BaseModel):
    """Filters for searching compliance records"""
    session_ids: Optional[List[str]] = None
    compliance_status: Optional[List[ComplianceStatus]] = None
    category: Optional[List[ComplianceCategory]] = None
    bank_id: Optional[int] = None
    branch_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    minimum_compliance_score: Optional[float] = Field(None, ge=0, le=100)
    maximum_compliance_score: Optional[float] = Field(None, ge=0, le=100)
    requires_approval: Optional[bool] = None
    approved_status: Optional[bool] = None
    location_verified: Optional[bool] = None
    has_regulatory_notes: Optional[bool] = None

class ComplianceListResponse(BaseModel):
    """Response model for compliance records list"""
    compliance_records: List[RBIComplianceData]
    total_count: int
    filtered_count: int
    page: int
    page_size: int
    filters_applied: Optional[ComplianceSearchFilters] = None
    aggregated_stats: Optional[Dict[str, Any]] = None

# ============================================================================
# Compliance Analytics Models
# ============================================================================

class ComplianceAnalytics(BaseModel):
    """Analytics and insights for RBI compliance"""
    analysis_period_start: datetime
    analysis_period_end: datetime
    
    # Overall compliance metrics
    total_appraisals_analyzed: int
    overall_compliance_rate: float = Field(..., ge=0, le=100)
    average_compliance_score: float = Field(..., ge=0, le=100)
    
    # Compliance by category
    compliance_by_category: Dict[ComplianceCategory, float] = Field(default_factory=dict)
    most_violated_requirements: List[str] = Field(default_factory=list)
    best_performing_categories: List[str] = Field(default_factory=list)
    
    # Trends and patterns
    compliance_trend: Dict[str, float] = Field(default_factory=dict, description="Compliance rate by month")
    violation_patterns: Dict[str, int] = Field(default_factory=dict)
    improvement_areas: List[str] = Field(default_factory=list)
    
    # Risk analysis
    high_risk_sessions: int
    medium_risk_sessions: int
    low_risk_sessions: int
    risk_score_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # Geographic analysis
    compliance_by_branch: Dict[str, float] = Field(default_factory=dict)
    location_verification_rate: float = Field(..., ge=0, le=100)
    
    # Recommendations
    regulatory_recommendations: List[str] = Field(default_factory=list)
    training_recommendations: List[str] = Field(default_factory=list)
    process_improvements: List[str] = Field(default_factory=list)

# ============================================================================
# Audit Trail Models
# ============================================================================

class ComplianceAuditEntry(BaseModel):
    """Individual audit trail entry for compliance"""
    entry_id: str = Field(..., description="Unique audit entry ID")
    session_id: str = Field(..., description="Related session ID")
    timestamp: datetime = Field(default_factory=datetime.now)
    
    # Action details
    action_type: str = Field(..., description="Type of action performed")
    action_description: str = Field(..., description="Description of action")
    performed_by: str = Field(..., description="User who performed the action")
    user_role: Optional[str] = Field(None, description="Role of the user")
    
    # Change details
    field_changed: Optional[str] = Field(None, description="Field that was changed")
    old_value: Optional[str] = Field(None, description="Previous value")
    new_value: Optional[str] = Field(None, description="New value")
    change_reason: Optional[str] = Field(None, description="Reason for change")
    
    # Context
    ip_address: Optional[str] = Field(None, description="IP address of user")
    user_agent: Optional[str] = Field(None, description="Browser/client information")
    geographic_location: Optional[str] = Field(None, description="Geographic location")

class ComplianceAuditTrail(BaseModel):
    """Complete audit trail for compliance session"""
    session_id: str
    audit_entries: List[ComplianceAuditEntry] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Summary statistics
    total_actions: int
    unique_users: int
    action_types_count: Dict[str, int] = Field(default_factory=dict)
    compliance_timeline: List[Dict[str, Any]] = Field(default_factory=list)