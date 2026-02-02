"""
Purity Testing Schemas for Gold Loan Appraisal System

This module contains schemas for:
- Gold purity testing and analysis
- Test methods and equipment
- Quality assurance and certification
- Test results and reporting
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

from .common import TimestampMixin, TenantMixin, ImageUpload

# ============================================================================
# Purity Testing Enums
# ============================================================================

class PurityTestMethod(str, Enum):
    """Methods for testing gold purity"""
    ACID_TEST = "acid_test"
    ELECTRONIC_TEST = "electronic_test"
    FIRE_ASSAY = "fire_assay"
    X_RAY_FLUORESCENCE = "x_ray_fluorescence"
    ULTRASONIC_TEST = "ultrasonic_test"
    HALLMARK_VERIFICATION = "hallmark_verification"
    MAGNETIC_TEST = "magnetic_test"
    DENSITY_TEST = "density_test"
    SCRATCH_TEST = "scratch_test"

class PurityGrade(str, Enum):
    """Standard gold purity grades"""
    KARAT_24 = "24k"
    KARAT_22 = "22k"
    KARAT_20 = "20k"
    KARAT_18 = "18k"
    KARAT_16 = "16k"
    KARAT_14 = "14k"
    KARAT_12 = "12k"
    KARAT_10 = "10k"
    KARAT_9 = "9k"
    UNKNOWN = "unknown"

class TestStatus(str, Enum):
    """Status of purity test"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    REQUIRES_RETEST = "requires_retest"
    CERTIFIED = "certified"

class TestEquipmentType(str, Enum):
    """Types of testing equipment"""
    ACID_KIT = "acid_kit"
    ELECTRONIC_TESTER = "electronic_tester"
    XRF_ANALYZER = "xrf_analyzer"
    ULTRASONIC_CLEANER = "ultrasonic_cleaner"
    DIGITAL_SCALE = "digital_scale"
    MAGNIFYING_GLASS = "magnifying_glass"
    HARDNESS_TESTER = "hardness_tester"

class QualityAssuranceLevel(str, Enum):
    """Quality assurance levels"""
    BASIC = "basic"
    STANDARD = "standard"
    ENHANCED = "enhanced"
    PREMIUM = "premium"
    CERTIFIED = "certified"

# ============================================================================
# Test Equipment Models
# ============================================================================

class TestEquipment(BaseModel):
    """Model for testing equipment information"""
    equipment_id: str = Field(..., description="Unique equipment identifier")
    equipment_type: TestEquipmentType
    equipment_name: str = Field(..., description="Name/model of equipment")
    manufacturer: Optional[str] = Field(None, description="Equipment manufacturer")
    model_number: Optional[str] = Field(None, description="Model number")
    serial_number: Optional[str] = Field(None, description="Serial number")
    
    # Calibration and maintenance
    last_calibration_date: Optional[datetime] = None
    next_calibration_due: Optional[datetime] = None
    calibration_certificate: Optional[str] = Field(None, description="Calibration certificate number")
    maintenance_schedule: Optional[str] = None
    
    # Accuracy and specifications
    accuracy_range: Optional[str] = Field(None, description="Equipment accuracy range")
    measurement_range: Optional[str] = Field(None, description="Measurement range")
    resolution: Optional[str] = Field(None, description="Measurement resolution")
    
    # Status
    is_operational: bool = Field(True, description="Whether equipment is operational")
    last_used: Optional[datetime] = None
    usage_count: int = Field(0, description="Number of times used")

# ============================================================================
# Purity Test Models
# ============================================================================

class PurityTestConfiguration(BaseModel):
    """Configuration for purity testing"""
    test_method: PurityTestMethod
    equipment_used: List[str] = Field(default_factory=list, description="Equipment IDs used")
    test_parameters: Dict[str, Any] = Field(default_factory=dict, description="Test-specific parameters")
    quality_level: QualityAssuranceLevel = QualityAssuranceLevel.STANDARD
    
    # Test conditions
    ambient_temperature: Optional[float] = Field(None, description="Ambient temperature in Celsius")
    humidity_level: Optional[float] = Field(None, description="Humidity percentage")
    test_duration: Optional[int] = Field(None, description="Test duration in minutes")
    
    # Standards and references
    reference_standards: Optional[List[str]] = Field(default_factory=list)
    calibration_samples: Optional[List[str]] = Field(default_factory=list)

class IndividualItemTest(BaseModel):
    """Purity test data for individual jewelry item"""
    item_id: str = Field(..., description="Unique item identifier")
    item_description: Optional[str] = Field(None, description="Description of the item")
    item_weight: Optional[float] = Field(None, ge=0, description="Weight in grams")
    item_type: Optional[str] = Field(None, description="Type of jewelry item")
    
    # Test configuration
    test_configuration: PurityTestConfiguration
    
    # Test results
    purity_percentage: Optional[float] = Field(None, ge=0, le=100, description="Purity percentage")
    purity_karat: Optional[float] = Field(None, ge=0, le=24, description="Purity in karats")
    purity_grade: Optional[PurityGrade] = None
    fineness: Optional[int] = Field(None, ge=0, le=1000, description="Fineness (parts per 1000)")
    
    # Detailed analysis
    alloy_composition: Optional[Dict[str, float]] = Field(default_factory=dict, description="Alloy composition")
    impurities_detected: Optional[List[str]] = Field(default_factory=list)
    surface_condition: Optional[str] = Field(None, description="Surface condition assessment")
    
    # Test quality metrics
    test_confidence: Optional[float] = Field(None, ge=0, le=100, description="Confidence level of test")
    measurement_variance: Optional[float] = Field(None, description="Variance in measurements")
    repeat_test_results: Optional[List[float]] = Field(default_factory=list)
    
    # Visual documentation
    item_images: List[str] = Field(default_factory=list, description="Images of the item")
    test_process_images: Optional[List[str]] = Field(default_factory=list)
    result_images: Optional[List[str]] = Field(default_factory=list)
    
    # Status and verification
    test_status: TestStatus = TestStatus.PENDING
    tested_at: Optional[datetime] = None
    tested_by: Optional[str] = Field(None, description="Tester/technician name")
    verified_by: Optional[str] = Field(None, description="Verifier/supervisor name")
    
    # Comments and observations
    tester_notes: Optional[str] = None
    quality_observations: Optional[str] = None
    recommendations: Optional[List[str]] = Field(default_factory=list)

# ============================================================================
# Purity Test Results Models
# ============================================================================

class PurityTestSummary(BaseModel):
    """Summary of purity test results"""
    total_items_tested: int = Field(0, description="Total number of items tested")
    average_purity: Optional[float] = Field(None, description="Average purity percentage")
    average_karat: Optional[float] = Field(None, description="Average karat value")
    highest_purity: Optional[float] = Field(None, description="Highest purity found")
    lowest_purity: Optional[float] = Field(None, description="Lowest purity found")
    
    # Distribution analysis
    purity_grade_distribution: Dict[PurityGrade, int] = Field(default_factory=dict)
    purity_range_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # Quality metrics
    overall_quality_score: Optional[float] = Field(None, ge=0, le=100)
    test_reliability_score: Optional[float] = Field(None, ge=0, le=100)
    consistency_score: Optional[float] = Field(None, ge=0, le=100)

class QualityAssuranceMetrics(BaseModel):
    """Quality assurance metrics for testing"""
    test_accuracy: Optional[float] = Field(None, ge=0, le=100, description="Test accuracy percentage")
    precision_level: Optional[float] = Field(None, ge=0, le=100, description="Precision level")
    repeatability: Optional[float] = Field(None, ge=0, le=100, description="Repeatability score")
    reproducibility: Optional[float] = Field(None, ge=0, le=100, description="Reproducibility score")
    
    # Calibration status
    equipment_calibration_status: bool = Field(True, description="All equipment properly calibrated")
    reference_sample_verified: bool = Field(True, description="Reference samples verified")
    environmental_conditions_acceptable: bool = Field(True, description="Environmental conditions acceptable")
    
    # Validation results
    control_sample_results: Optional[List[float]] = Field(default_factory=list)
    blank_test_results: Optional[List[float]] = Field(default_factory=list)
    duplicate_test_variance: Optional[float] = None

class CertificationData(BaseModel):
    """Certification and compliance data"""
    certification_required: bool = Field(False, description="Whether certification is required")
    certification_standard: Optional[str] = Field(None, description="Applicable certification standard")
    certified: bool = Field(False, description="Whether results are certified")
    certification_number: Optional[str] = Field(None, description="Certificate number")
    certification_date: Optional[datetime] = None
    certified_by: Optional[str] = Field(None, description="Certifying authority/person")
    certification_validity: Optional[datetime] = Field(None, description="Certification expiry date")
    
    # Compliance information
    regulatory_compliance: bool = Field(True, description="Meets regulatory requirements")
    industry_standards_met: List[str] = Field(default_factory=list)
    compliance_notes: Optional[str] = None

# ============================================================================
# Complete Purity Test Data Model
# ============================================================================

class PurityTestData(TimestampMixin, TenantMixin):
    """Complete purity test data model"""
    id: Optional[int] = None
    session_id: str = Field(..., description="Associated session ID")
    
    # Test overview
    test_method: PurityTestMethod = PurityTestMethod.ELECTRONIC_TEST
    quality_level: QualityAssuranceLevel = QualityAssuranceLevel.STANDARD
    total_items: int = Field(0, ge=0, description="Total number of items tested")
    
    # Individual item results
    individual_tests: List[IndividualItemTest] = Field(default_factory=list)
    
    # Overall results summary
    test_summary: Optional[PurityTestSummary] = None
    quality_metrics: Optional[QualityAssuranceMetrics] = None
    certification_data: Optional[CertificationData] = None
    
    # Test conditions and environment
    test_location: Optional[str] = None
    testing_facility: Optional[str] = None
    environmental_conditions: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    # Personnel information
    primary_tester: Optional[str] = Field(None, description="Primary tester name")
    supervising_officer: Optional[str] = Field(None, description="Supervising officer")
    quality_controller: Optional[str] = Field(None, description="Quality controller")
    
    # Test workflow
    test_started_at: Optional[datetime] = None
    test_completed_at: Optional[datetime] = None
    total_test_duration: Optional[float] = Field(None, description="Total duration in minutes")
    
    # Documentation and images
    process_documentation: Optional[List[str]] = Field(default_factory=list)
    equipment_verification_images: Optional[List[str]] = Field(default_factory=list)
    final_report_document: Optional[str] = None
    
    # Legacy compatibility
    results: Optional[Union[str, Dict[str, Any]]] = Field(None, description="Legacy results field")
    
    class Config:
        from_attributes = True

# ============================================================================
# Purity Test Request Models
# ============================================================================

class PurityTestRequest(BaseModel):
    """Request model for initiating purity test"""
    session_id: str
    test_method: PurityTestMethod = PurityTestMethod.ELECTRONIC_TEST
    quality_level: QualityAssuranceLevel = QualityAssuranceLevel.STANDARD
    items_to_test: List[Dict[str, Any]] = Field(..., description="Items to be tested")
    
    # Test preferences
    priority: str = Field("normal", pattern="^(low|normal|high|urgent)$")
    special_instructions: Optional[str] = None
    certification_required: bool = False
    
    # Quality requirements
    minimum_accuracy_required: Optional[float] = Field(None, ge=0, le=100)
    repeat_tests_count: int = Field(1, ge=1, le=5, description="Number of repeat tests")
    
    # Scheduling
    preferred_test_date: Optional[datetime] = None
    estimated_duration: Optional[int] = Field(None, description="Estimated duration in minutes")

class PurityTestResponse(BaseModel):
    """Response model for purity test results"""
    test_id: str
    session_id: str
    test_status: TestStatus
    completion_percentage: float = Field(..., ge=0, le=100)
    
    # Results summary
    items_tested: int
    items_passed: int
    items_failed: int
    average_purity: Optional[float] = None
    
    # Quality information
    overall_quality_score: Optional[float] = None
    certification_status: Optional[str] = None
    
    # Timing
    test_started_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None
    actual_completion: Optional[datetime] = None
    
    # Access to detailed results
    detailed_results_available: bool
    report_download_url: Optional[str] = None
    certificate_download_url: Optional[str] = None

# ============================================================================
# Purity Test Analytics Models
# ============================================================================

class PurityTestAnalytics(BaseModel):
    """Analytics for purity testing operations"""
    analysis_period_start: datetime
    analysis_period_end: datetime
    
    # Volume metrics
    total_tests_conducted: int
    total_items_tested: int
    average_items_per_test: float
    
    # Purity distribution
    purity_distribution: Dict[PurityGrade, int] = Field(default_factory=dict)
    average_purity_by_method: Dict[PurityTestMethod, float] = Field(default_factory=dict)
    purity_trends: Dict[str, float] = Field(default_factory=dict)
    
    # Quality metrics
    average_test_accuracy: float
    average_confidence_score: float
    test_failure_rate: float = Field(..., ge=0, le=100)
    retest_rate: float = Field(..., ge=0, le=100)
    
    # Efficiency metrics
    average_test_duration: float = Field(..., description="Average test duration in minutes")
    throughput_per_hour: float
    equipment_utilization: Dict[str, float] = Field(default_factory=dict)
    
    # Tester performance
    tester_performance: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    best_performing_testers: List[str] = Field(default_factory=list)
    
    # Insights and recommendations
    quality_improvement_areas: List[str] = Field(default_factory=list)
    equipment_recommendations: List[str] = Field(default_factory=list)
    process_optimization_suggestions: List[str] = Field(default_factory=list)

# ============================================================================
# Equipment Maintenance Models
# ============================================================================

class EquipmentMaintenanceRecord(BaseModel):
    """Record of equipment maintenance"""
    maintenance_id: str = Field(..., description="Unique maintenance record ID")
    equipment_id: str = Field(..., description="Equipment identifier")
    maintenance_type: str = Field(..., description="Type of maintenance")
    maintenance_date: datetime = Field(default_factory=datetime.now)
    performed_by: str = Field(..., description="Technician who performed maintenance")
    
    # Maintenance details
    maintenance_description: str = Field(..., description="Description of maintenance performed")
    parts_replaced: Optional[List[str]] = Field(default_factory=list)
    maintenance_duration: Optional[int] = Field(None, description="Duration in hours")
    cost: Optional[float] = Field(None, description="Maintenance cost")
    
    # Before/after status
    condition_before: Optional[str] = None
    condition_after: Optional[str] = None
    performance_improvement: Optional[str] = None
    
    # Validation and testing
    post_maintenance_test_results: Optional[Dict[str, Any]] = Field(default_factory=dict)
    validation_performed: bool = Field(False)
    validation_passed: Optional[bool] = None
    
    # Next maintenance
    next_maintenance_due: Optional[datetime] = None
    maintenance_notes: Optional[str] = None

# ============================================================================
# Search and Filter Models
# ============================================================================

class PurityTestSearchFilters(BaseModel):
    """Filters for searching purity test records"""
    session_ids: Optional[List[str]] = None
    test_method: Optional[List[PurityTestMethod]] = None
    test_status: Optional[List[TestStatus]] = None
    quality_level: Optional[List[QualityAssuranceLevel]] = None
    purity_grade: Optional[List[PurityGrade]] = None
    
    # Date filters
    test_date_from: Optional[datetime] = None
    test_date_to: Optional[datetime] = None
    
    # Numeric filters
    min_purity: Optional[float] = Field(None, ge=0, le=100)
    max_purity: Optional[float] = Field(None, ge=0, le=100)
    min_items: Optional[int] = Field(None, ge=0)
    max_items: Optional[int] = Field(None, ge=0)
    
    # Quality filters
    min_confidence: Optional[float] = Field(None, ge=0, le=100)
    certified_only: Optional[bool] = None
    requires_retest: Optional[bool] = None
    
    # Personnel filters
    tested_by: Optional[List[str]] = None
    verified_by: Optional[List[str]] = None
    
    # Tenant filters
    bank_id: Optional[int] = None
    branch_id: Optional[int] = None

class PurityTestListResponse(BaseModel):
    """Response model for purity test list"""
    tests: List[PurityTestData]
    total_count: int
    filtered_count: int
    page: int
    page_size: int
    filters_applied: Optional[PurityTestSearchFilters] = None
    summary_statistics: Optional[Dict[str, Any]] = None