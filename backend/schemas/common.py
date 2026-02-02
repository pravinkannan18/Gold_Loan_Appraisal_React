"""
Common/Shared Schemas for Gold Loan Appraisal System

This module contains base classes, mixins, and common schemas used across
multiple domains in the application.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# ============================================================================
# Base Mixins  
# ============================================================================

class TimestampMixin(BaseModel):
    """Mixin for created_at and updated_at timestamps"""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        """Pydantic config for mixin"""
        pass

class TenantMixin(BaseModel):
    """Mixin for tenant context fields"""
    bank_id: Optional[int] = Field(None, description="Bank ID for tenant context")
    branch_id: Optional[int] = Field(None, description="Branch ID for tenant context") 
    tenant_user_id: Optional[int] = Field(None, description="Tenant user ID")
    
    class Config:
        """Pydantic config for mixin"""
        pass

# ============================================================================
# Common Enums
# ============================================================================

class StatusEnum(str, Enum):
    """Generic status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class PriorityEnum(str, Enum):
    """Priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# ============================================================================
# Base Response Models
# ============================================================================

class BaseResponse(BaseModel):
    """Base response model with standard fields"""
    success: bool = True
    message: str = "Operation completed successfully"
    timestamp: datetime = Field(default_factory=datetime.now)

class ErrorResponse(BaseResponse):
    """Error response model"""
    success: bool = False
    error_code: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None

class PaginatedResponse(BaseModel):
    """Base model for paginated responses"""
    total_count: int = Field(..., description="Total number of items")
    page: int = Field(1, ge=1, description="Current page number")
    page_size: int = Field(10, ge=1, le=100, description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_previous: bool = Field(..., description="Whether there is a previous page")

# ============================================================================
# Common Request Models
# ============================================================================

class PaginationParams(BaseModel):
    """Pagination parameters for requests"""
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(10, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_order: Optional[str] = Field("asc", pattern="^(asc|desc)$", description="Sort order")

class SearchParams(BaseModel):
    """Search parameters for filtering"""
    query: Optional[str] = Field(None, description="Search query string")
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional filters")
    date_from: Optional[datetime] = Field(None, description="Start date for filtering")
    date_to: Optional[datetime] = Field(None, description="End date for filtering")

# ============================================================================
# File Upload Models
# ============================================================================

class ImageUpload(BaseModel):
    """Model for image upload data"""
    image_data: str = Field(..., description="Base64 encoded image data")
    filename: Optional[str] = Field(None, description="Original filename")
    content_type: Optional[str] = Field(None, description="MIME type of the image")
    size: Optional[int] = Field(None, description="File size in bytes")

class DocumentUpload(BaseModel):
    """Model for document upload data"""
    document_data: str = Field(..., description="Base64 encoded document data")
    filename: str = Field(..., description="Original filename")
    content_type: str = Field(..., description="MIME type of the document")
    size: Optional[int] = Field(None, description="File size in bytes")
    document_type: Optional[str] = Field(None, description="Type of document")

# ============================================================================
# GPS and Location Models
# ============================================================================

class GPSCoordinates(BaseModel):
    """GPS coordinates model"""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    accuracy: Optional[float] = Field(None, ge=0, description="GPS accuracy in meters")
    altitude: Optional[float] = Field(None, description="Altitude in meters")
    timestamp: Optional[datetime] = Field(None, description="GPS reading timestamp")

class AddressInfo(BaseModel):
    """Address information model"""
    street_address: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City")
    state: Optional[str] = Field(None, description="State")
    postal_code: Optional[str] = Field(None, description="Postal/ZIP code")
    country: Optional[str] = Field(None, description="Country")
    gps_coordinates: Optional[GPSCoordinates] = Field(None, description="GPS coordinates")

# ============================================================================
# Contact Information Models
# ============================================================================

class ContactInfo(BaseModel):
    """Contact information model"""
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    mobile: Optional[str] = Field(None, description="Mobile number")
    landline: Optional[str] = Field(None, description="Landline number")
    fax: Optional[str] = Field(None, description="Fax number")

# ============================================================================
# Configuration Models
# ============================================================================

class SystemConfiguration(BaseModel):
    """System configuration model"""
    max_file_size: Optional[int] = Field(None, description="Maximum file size in bytes")
    allowed_file_types: Optional[list] = Field(default_factory=list, description="Allowed file extensions")
    session_timeout: Optional[int] = Field(None, description="Session timeout in minutes")
    max_concurrent_sessions: Optional[int] = Field(None, description="Maximum concurrent sessions")
    features_enabled: Optional[Dict[str, bool]] = Field(default_factory=dict, description="Feature toggles")

class TenantSettings(BaseModel):
    """Tenant-specific settings model"""
    allow_online_appraisal: Optional[bool] = Field(True, description="Allow online appraisals")
    require_customer_photo: Optional[bool] = Field(True, description="Require customer photograph")
    gps_verification_required: Optional[bool] = Field(True, description="GPS verification required")
    facial_recognition_enabled: Optional[bool] = Field(True, description="Enable facial recognition")
    max_loan_amount: Optional[float] = Field(None, description="Maximum loan amount")
    min_loan_amount: Optional[float] = Field(None, description="Minimum loan amount")
    loan_to_value_ratio: Optional[float] = Field(None, description="Loan to value ratio")

# ============================================================================
# Utility Functions for Schemas
# ============================================================================

def create_paginated_response(items: list, total_count: int, page: int, page_size: int, data_key: str = "items"):
    """Create a paginated response"""
    total_pages = (total_count + page_size - 1) // page_size
    has_next = page < total_pages
    has_previous = page > 1
    
    return {
        data_key: items,
        "pagination": {
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_previous": has_previous
        }
    }

# ============================================================================
# Validation Helpers
# ============================================================================

class ValidationHelpers:
    """Helper class with common validation methods"""
    
    @staticmethod
    def validate_phone_number(phone: str) -> str:
        """Validate and format phone number"""
        if phone and not phone.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise ValueError('Invalid phone number format')
        return phone
    
    @staticmethod
    def validate_postal_code(code: str) -> str:
        """Validate postal code"""
        if code and (len(code) < 3 or len(code) > 10):
            raise ValueError('Postal code must be between 3 and 10 characters')
        return code
    
    @staticmethod
    def validate_coordinate(value: float, coord_type: str) -> float:
        """Validate GPS coordinates"""
        if coord_type == 'latitude' and not -90 <= value <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        elif coord_type == 'longitude' and not -180 <= value <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return value