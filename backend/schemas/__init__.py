"""
Schemas Package for Gold Loan Appraisal System

This package contains all Pydantic models and schemas organized by domain:

- common: Base classes, mixins, and shared models
- tenant: Tenant hierarchy (banks, branches, users)
- appraiser: Appraiser management and authentication
- appraisal: Session/appraisal workflow and management
- customer: Customer profiles and management
- rbi: RBI compliance and regulatory requirements
- purity: Gold purity testing and analysis

Usage:
    from schemas.tenant import Bank, Branch, TenantUser
    from schemas.appraiser import AppraiserProfile, FaceRecognitionResult
    from schemas.appraisal import Session, SessionCreate
    from schemas.customer import CustomerProfile, CustomerSessionData
    from schemas.rbi import RBIComplianceData, ComplianceChecklist
    from schemas.purity import PurityTestData, IndividualItemTest
"""

# Import all common schemas
from .common import (
    # Base mixins
    TimestampMixin,
    TenantMixin,
    
    # Common enums
    StatusEnum,
    PriorityEnum,
    
    # Base response models
    BaseResponse,
    ErrorResponse,
    PaginatedResponse,
    
    # Common request models
    PaginationParams,
    SearchParams,
    
    # File upload models
    ImageUpload,
    DocumentUpload,
    
    # Location models
    GPSCoordinates,
    AddressInfo,
    
    # Contact models
    ContactInfo,
    
    # Configuration models
    SystemConfiguration,
    TenantSettings,
    
    # Utility functions
    create_paginated_response,
    ValidationHelpers,
)

# Import tenant hierarchy schemas
from .tenant import (
    # Enums
    UserRole,
    
    # Bank models
    Bank,
    BankCreate,
    BankUpdate,
    BankBase,
    
    # Branch models
    Branch,
    BranchCreate,
    BranchUpdate,
    BranchBase,
    OperationalHours,
    
    # Tenant user models
    TenantUser,
    TenantUserCreate,
    TenantUserUpdate,
    TenantUserBase,
    UserPermissions,
    
    # Context models
    TenantContext,
    
    # Response models
    TenantHierarchyResponse,
    BankStatsResponse,
    TenantSetupResponse,
    
    # Request models
    TenantContextRequest,
    BulkUserCreateRequest,
    TenantMigrationRequest,
)

# Import appraiser schemas
from .appraiser import (
    # Enums
    AppraiserStatus,
    CertificationLevel,
    AuthenticationMethod,
    
    # Base models
    AppraiserBase,
    
    # Facial recognition models
    FaceEncodingData,
    FaceRecognitionResult,
    
    # Registration models
    AppraiserRegistrationData,
    AppraiserRegistrationRequest,
    AppraiserRegistrationResponse,
    
    # Authentication models
    AppraiserAuthenticationRequest,
    AppraiserAuthenticationResponse,
    
    # Profile models
    AppraiserProfile,
    AppraiserCertification,
    AppraiserTraining,
    AppraiserPerformanceMetrics,
    
    # Management models
    AppraiserStatusUpdate,
    AppraiserBulkAction,
    
    # Search models
    AppraiserSearchFilters,
    AppraiserListResponse,
    
    # Reporting models
    AppraiserReportSummary,
    TeamPerformanceReport,
)

# Import appraisal/session schemas
from .appraisal import (
    # Enums
    SessionStatus,
    SessionType,
    SessionPriority,
    
    # Base models
    SessionBase,
    
    # Creation models
    SessionMetadata,
    CustomerContext,
    SessionCreate,
    SessionCreateRequest,
    
    # Update models
    SessionStatusUpdate,
    SessionUpdate,
    
    # Complete session model
    Session,
    
    # Workflow models
    SessionStep,
    SessionWorkflow,
    
    # Data models
    SessionDataSummary,
    SessionValidation,
    
    # Search models
    SessionSearchFilters,
    SessionListResponse,
    
    # Analytics models
    SessionTimeAnalytics,
    SessionStatusAnalytics,
    SessionQualityMetrics,
    SessionAnalyticsReport,
    
    # Export models
    SessionExportRequest,
    SessionExportResponse,
    
    # Bulk operations
    SessionBulkAction,
    SessionBulkActionResult,
)

# Import customer schemas
from .customer import (
    # Enums
    CustomerType,
    IdentificationDocumentType,
    CustomerStatus,
    KYCStatus,
    RiskProfile,
    
    # Identity models
    IdentificationDocument,
    CustomerIdentity,
    
    # Base models
    CustomerBase,
    
    # Profile models
    CustomerFinancialProfile,
    CustomerKYC,
    CustomerProfile,
    
    # Session data models
    CustomerSessionData,
    
    # Interaction models
    CustomerInteraction,
    CustomerFeedback,
    
    # Search models
    CustomerSearchFilters,
    CustomerListResponse,
    
    # Analytics models
    CustomerAnalytics,
    
    # Document upload models
    CustomerDocumentUploadRequest,
    CustomerDocumentUploadResponse,
    
    # Bulk operations
    CustomerBulkAction,
    CustomerImportRequest,
)

# Import RBI compliance schemas
from .rbi import (
    # Enums
    ComplianceStatus,
    ComplianceCategory,
    RegulatoryFramework,
    ComplianceCheckType,
    
    # Compliance models
    ComplianceItem,
    ComplianceChecklist,
    
    # Data models
    RBIComplianceBase,
    JewelryItemCompliance,
    RBIComplianceData,
    
    # Validation models
    ComplianceValidationRule,
    ComplianceValidationResult,
    ComplianceValidationReport,
    
    # Reporting models
    RegulatoryReport,
    
    # Search models
    ComplianceSearchFilters,
    ComplianceListResponse,
    
    # Analytics models
    ComplianceAnalytics,
    
    # Audit models
    ComplianceAuditEntry,
    ComplianceAuditTrail,
)

# Import purity testing schemas
from .purity import (
    # Enums
    PurityTestMethod,
    PurityGrade,
    TestStatus,
    TestEquipmentType,
    QualityAssuranceLevel,
    
    # Equipment models
    TestEquipment,
    
    # Test models
    PurityTestConfiguration,
    IndividualItemTest,
    
    # Results models
    PurityTestSummary,
    QualityAssuranceMetrics,
    CertificationData,
    
    # Complete model
    PurityTestData,
    
    # Request/response models
    PurityTestRequest,
    PurityTestResponse,
    
    # Analytics models
    PurityTestAnalytics,
    
    # Maintenance models
    EquipmentMaintenanceRecord,
    
    # Search models
    PurityTestSearchFilters,
    PurityTestListResponse,
)

# Version information
__version__ = "1.0.0"
__author__ = "Gold Loan Appraisal Development Team"

# Schema categories for documentation and tooling
SCHEMA_CATEGORIES = {
    "common": "Base classes and shared models",
    "tenant": "Tenant hierarchy management",
    "appraiser": "Appraiser management and authentication",
    "appraisal": "Session and appraisal workflow",
    "customer": "Customer profiles and management",
    "rbi": "RBI compliance and regulatory",
    "purity": "Gold purity testing and analysis",
}

# All available schemas organized by category
ALL_SCHEMAS = {
    "common": [
        "TimestampMixin", "TenantMixin", "StatusEnum", "PriorityEnum",
        "BaseResponse", "ErrorResponse", "PaginatedResponse",
        "PaginationParams", "SearchParams", "ImageUpload", "DocumentUpload",
        "GPSCoordinates", "AddressInfo", "ContactInfo",
        "SystemConfiguration", "TenantSettings",
    ],
    "tenant": [
        "UserRole", "Bank", "BankCreate", "BankUpdate", "BankBase",
        "Branch", "BranchCreate", "BranchUpdate", "BranchBase", "OperationalHours",
        "TenantUser", "TenantUserCreate", "TenantUserUpdate", "TenantUserBase", "UserPermissions",
        "TenantContext", "TenantHierarchyResponse", "BankStatsResponse", "TenantSetupResponse",
    ],
    "appraiser": [
        "AppraiserStatus", "CertificationLevel", "AuthenticationMethod",
        "AppraiserBase", "FaceEncodingData", "FaceRecognitionResult",
        "AppraiserRegistrationData", "AppraiserRegistrationRequest", "AppraiserRegistrationResponse",
        "AppraiserAuthenticationRequest", "AppraiserAuthenticationResponse",
        "AppraiserProfile", "AppraiserCertification", "AppraiserTraining", "AppraiserPerformanceMetrics",
    ],
    "appraisal": [
        "SessionStatus", "SessionType", "SessionPriority", "SessionBase",
        "SessionMetadata", "CustomerContext", "SessionCreate", "SessionCreateRequest",
        "SessionStatusUpdate", "SessionUpdate", "Session",
        "SessionStep", "SessionWorkflow", "SessionDataSummary", "SessionValidation",
        "SessionSearchFilters", "SessionListResponse", "SessionAnalyticsReport",
    ],
    "customer": [
        "CustomerType", "IdentificationDocumentType", "CustomerStatus", "KYCStatus", "RiskProfile",
        "IdentificationDocument", "CustomerIdentity", "CustomerBase",
        "CustomerFinancialProfile", "CustomerKYC", "CustomerProfile",
        "CustomerSessionData", "CustomerInteraction", "CustomerFeedback",
        "CustomerSearchFilters", "CustomerListResponse", "CustomerAnalytics",
    ],
    "rbi": [
        "ComplianceStatus", "ComplianceCategory", "RegulatoryFramework", "ComplianceCheckType",
        "ComplianceItem", "ComplianceChecklist", "RBIComplianceBase", "JewelryItemCompliance", "RBIComplianceData",
        "ComplianceValidationRule", "ComplianceValidationResult", "ComplianceValidationReport",
        "RegulatoryReport", "ComplianceSearchFilters", "ComplianceListResponse", "ComplianceAnalytics",
    ],
    "purity": [
        "PurityTestMethod", "PurityGrade", "TestStatus", "TestEquipmentType", "QualityAssuranceLevel",
        "TestEquipment", "PurityTestConfiguration", "IndividualItemTest",
        "PurityTestSummary", "QualityAssuranceMetrics", "CertificationData", "PurityTestData",
        "PurityTestRequest", "PurityTestResponse", "PurityTestAnalytics",
    ],
}

def get_schemas_by_category(category: str) -> list:
    """Get all schemas for a specific category"""
    return ALL_SCHEMAS.get(category, [])

def get_all_schema_names() -> list:
    """Get names of all available schemas"""
    all_schemas = []
    for schemas in ALL_SCHEMAS.values():
        all_schemas.extend(schemas)
    return sorted(all_schemas)

def print_schema_summary():
    """Print a summary of all available schemas"""
    print("Gold Loan Appraisal System - Schema Summary")
    print("=" * 50)
    
    for category, description in SCHEMA_CATEGORIES.items():
        schemas = get_schemas_by_category(category)
        print(f"\n{category.upper()}: {description}")
        print(f"  Schemas: {len(schemas)}")
        for schema in schemas[:5]:  # Show first 5
            print(f"    - {schema}")
        if len(schemas) > 5:
            print(f"    ... and {len(schemas) - 5} more")
    
    print(f"\nTotal Schemas: {len(get_all_schema_names())}")

# Export convenience functions
__all__ = [
    # Common schemas
    "TimestampMixin", "TenantMixin", "StatusEnum", "PriorityEnum",
    "BaseResponse", "ErrorResponse", "PaginatedResponse",
    "PaginationParams", "SearchParams", "ImageUpload", "DocumentUpload",
    "GPSCoordinates", "AddressInfo", "ContactInfo",
    "SystemConfiguration", "TenantSettings", "ValidationHelpers",
    
    # Tenant schemas
    "UserRole", "Bank", "Branch", "TenantUser", "TenantContext",
    "BankCreate", "BranchCreate", "TenantUserCreate",
    "TenantHierarchyResponse", "BankStatsResponse",
    
    # Appraiser schemas
    "AppraiserProfile", "FaceRecognitionResult", "AppraiserRegistrationRequest",
    "AppraiserAuthenticationRequest", "AppraiserStatus", "CertificationLevel",
    
    # Appraisal schemas
    "Session", "SessionCreate", "SessionStatus", "SessionType",
    "SessionListResponse", "SessionAnalyticsReport",
    
    # Customer schemas
    "CustomerProfile", "CustomerSessionData", "CustomerType",
    "CustomerStatus", "CustomerAnalytics",
    
    # RBI schemas
    "RBIComplianceData", "ComplianceChecklist", "ComplianceStatus",
    "ComplianceValidationReport",
    
    # Purity schemas
    "PurityTestData", "IndividualItemTest", "PurityTestMethod",
    "PurityGrade", "PurityTestAnalytics",
    
    # Utility functions
    "get_schemas_by_category", "get_all_schema_names", "print_schema_summary",
    "create_paginated_response",
]