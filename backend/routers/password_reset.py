"""
Password Reset API Router
Secure password reset for Bank Admin and Branch Admin
Implements 2-factor authentication with email link + OTP
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from pydantic import BaseModel, EmailStr
from models.database import get_db
import logging
import secrets
import hashlib
from datetime import datetime, timedelta
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/password-reset", tags=["password-reset"])

# ============================================================================
# Configuration
# ============================================================================

# Frontend URL for reset link
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")

# Token expiry times
RESET_TOKEN_EXPIRY_MINUTES = 10  # Reset token valid for 10 minutes
OTP_EXPIRY_MINUTES = 5  # OTP valid for 5 minutes

# Rate limiting (in-memory for demo; use Redis in production)
RATE_LIMIT_ATTEMPTS = {}
MAX_ATTEMPTS_PER_HOUR = 5
RATE_LIMIT_WINDOW = 3600  # 1 hour in seconds

# Email Configuration (SMTP)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")  # Your email
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")  # App password for Gmail
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@goldloan.com")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Gold Loan Appraisal System")

# ============================================================================
# Email & SMS Functions
# ============================================================================

def send_reset_email(to_email: str, reset_link: str, admin_type: str) -> bool:
    """Send password reset email via SMTP"""
    try:
        if not SMTP_USER or not SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured. Email not sent.")
            logger.info(f"[DEV MODE] Reset link for {to_email}: {reset_link}")
            return False
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Password Reset Request - Gold Loan Appraisal System'
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg['To'] = to_email
        
        # Plain text version
        text_content = f"""
Password Reset Request

Hello,

You have requested to reset your password for the Gold Loan Appraisal System ({admin_type.replace('_', ' ').title()}).

Click the link below to reset your password:
{reset_link}

This link will expire in 10 minutes.

If you did not request this password reset, please ignore this email or contact support.

Best regards,
Gold Loan Appraisal System Team
        """
        
        # HTML version
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .header h1 {{ color: white; margin: 0; font-size: 24px; }}
        .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
        .button:hover {{ background: linear-gradient(135deg, #2563eb, #1e40af); }}
        .footer {{ background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }}
        .warning {{ background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You have requested to reset your password for the <strong>Gold Loan Appraisal System</strong> ({admin_type.replace('_', ' ').title()}).</p>
            <p>Click the button below to reset your password:</p>
            <center>
                <a href="{reset_link}" class="button">Reset Password</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px; font-size: 12px;">{reset_link}</p>
            <div class="warning">
                <strong>⏰ Important:</strong> This link will expire in <strong>10 minutes</strong>.
            </div>
            <p style="margin-top: 20px;">If you did not request this password reset, please ignore this email or contact support immediately.</p>
        </div>
        <div class="footer">
            <p>© 2026 Gold Loan Appraisal System. All rights reserved.</p>
            <p>This is an automated message. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
        """
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, to_email, msg.as_string())
        
        logger.info(f"Password reset email sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        logger.info(f"[DEV MODE] Reset link for {to_email}: {reset_link}")
        return False

def send_otp_email(to_email: str, otp: str, admin_type: str) -> bool:
    """Send OTP via email (as fallback for SMS)"""
    try:
        if not SMTP_USER or not SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured. OTP email not sent.")
            logger.info(f"[DEV MODE] OTP for {to_email}: {otp}")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Your OTP Code - Gold Loan Appraisal System'
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg['To'] = to_email
        
        text_content = f"""
Your OTP Code

Your One-Time Password (OTP) for password reset is:

{otp}

This OTP will expire in 5 minutes.

If you did not request this, please ignore this email.

Best regards,
Gold Loan Appraisal System Team
        """
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .header h1 {{ color: white; margin: 0; }}
        .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; text-align: center; }}
        .otp-box {{ background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; font-size: 36px; font-weight: bold; letter-spacing: 10px; padding: 20px 40px; border-radius: 10px; display: inline-block; margin: 20px 0; }}
        .footer {{ background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Your OTP Code</h1>
        </div>
        <div class="content">
            <p>Your One-Time Password (OTP) for password reset is:</p>
            <div class="otp-box">{otp}</div>
            <p><strong>⏰ This OTP will expire in 5 minutes.</strong></p>
            <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2026 Gold Loan Appraisal System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, to_email, msg.as_string())
        
        logger.info(f"OTP email sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send OTP email: {e}")
        logger.info(f"[DEV MODE] OTP for {to_email}: {otp}")
        return False

# ============================================================================
# Helper Functions
# ============================================================================

def generate_secure_token() -> tuple[str, str]:
    """
    Generate cryptographically secure reset token
    Returns: (raw_token, hashed_token)
    """
    # 64 bytes = 512 bits of entropy
    raw_token = secrets.token_urlsafe(64)
    # SHA-256 hash for storage
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    return raw_token, token_hash


def generate_otp() -> tuple[str, str]:
    """
    Generate 6-digit OTP
    Returns: (raw_otp, hashed_otp)
    """
    # Generate 6-digit OTP
    raw_otp = str(secrets.randbelow(900000) + 100000)  # Ensures 6 digits
    otp_hash = hashlib.sha256(raw_otp.encode()).hexdigest()
    return raw_otp, otp_hash

def hash_password(password: str) -> str:
    """Hash password for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

def check_rate_limit(identifier: str, ip_address: str) -> bool:
    """
    Check if request is rate limited
    Returns True if allowed, False if rate limited
    """
    key = f"{identifier}:{ip_address}"
    current_time = datetime.utcnow().timestamp()
    
    if key in RATE_LIMIT_ATTEMPTS:
        attempts = RATE_LIMIT_ATTEMPTS[key]
        # Clean old attempts
        attempts = [t for t in attempts if current_time - t < RATE_LIMIT_WINDOW]
        RATE_LIMIT_ATTEMPTS[key] = attempts
        
        if len(attempts) >= MAX_ATTEMPTS_PER_HOUR:
            return False
    
    return True

def record_attempt(identifier: str, ip_address: str):
    """Record a reset attempt for rate limiting"""
    key = f"{identifier}:{ip_address}"
    current_time = datetime.utcnow().timestamp()
    
    if key not in RATE_LIMIT_ATTEMPTS:
        RATE_LIMIT_ATTEMPTS[key] = []
    
    RATE_LIMIT_ATTEMPTS[key].append(current_time)

# ============================================================================
# Request/Response Models
# ============================================================================

class ForgotPasswordRequest(BaseModel):
    """Request to initiate password reset"""
    email: EmailStr
    admin_type: str  # 'bank_admin' or 'branch_admin'
    bank_id: Optional[int] = None  # Required for bank_admin

class ForgotPasswordResponse(BaseModel):
    """Response after initiating password reset"""
    success: bool
    message: str
    requires_otp: bool = False

class ValidateResetTokenRequest(BaseModel):
    """Request to validate reset token"""
    token: str

class ValidateResetTokenResponse(BaseModel):
    """Response after validating reset token"""
    valid: bool
    email: Optional[str] = None
    admin_type: Optional[str] = None
    requires_otp: bool = False
    message: str

class ResetPasswordRequest(BaseModel):
    """Request to reset password"""
    token: str
    otp: Optional[str] = None  # Required for bank_admin
    new_password: str

class ResetPasswordResponse(BaseModel):
    """Response after resetting password"""
    success: bool
    message: str

class ResendOTPRequest(BaseModel):
    """Request to resend OTP"""
    token: str

class ResendOTPResponse(BaseModel):
    """Response after resending OTP"""
    success: bool
    message: str

# ============================================================================
# Database Setup
# ============================================================================

def init_password_reset_table(db):
    """Create password_reset_tokens table if not exists"""
    try:
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                user_email VARCHAR(255) NOT NULL,
                user_type VARCHAR(50) NOT NULL,
                bank_id INTEGER,
                branch_id INTEGER,
                token_hash VARCHAR(255) NOT NULL,
                otp_hash VARCHAR(255),
                expires_at TIMESTAMP NOT NULL,
                otp_expires_at TIMESTAMP,
                used BOOLEAN DEFAULT FALSE,
                ip_address VARCHAR(50),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash ON password_reset_tokens(token_hash)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(user_email)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at)')
        
        # Create audit log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS password_reset_audit_log (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                user_type VARCHAR(50) NOT NULL,
                action VARCHAR(100) NOT NULL,
                ip_address VARCHAR(50),
                user_agent TEXT,
                success BOOLEAN NOT NULL,
                error_message TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_log_email ON password_reset_audit_log(user_email)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_log_created ON password_reset_audit_log(created_at)')
        
        # Create bank_admins table for storing bank admin credentials
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bank_admins (
                id SERIAL PRIMARY KEY,
                bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
                email VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                full_name VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP,
                password_changed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(bank_id, email)
            )
        ''')
        
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bank_admins_email ON bank_admins(email)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bank_admins_bank ON bank_admins(bank_id)')
        
        db.commit()
        cursor.close()
        logger.info("Password reset tables initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing password reset tables: {e}")
        db.rollback()

def log_audit_event(db, email: str, user_type: str, action: str, 
                    ip_address: str, user_agent: str, success: bool,
                    error_message: str = None, metadata: dict = None):
    """Log password reset audit event"""
    try:
        cursor = db.cursor()
        import json
        cursor.execute('''
            INSERT INTO password_reset_audit_log 
            (user_email, user_type, action, ip_address, user_agent, success, error_message, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', (email, user_type, action, ip_address, user_agent, success, 
              error_message, json.dumps(metadata or {})))
        db.commit()
        cursor.close()
    except Exception as e:
        logger.error(f"Error logging audit event: {e}")

# ============================================================================
# Endpoints
# ============================================================================

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db = Depends(get_db)
):
    """
    Step 1: Initiate password reset
    - Validates email exists
    - Creates reset token
    - Sends reset link to email
    - For bank_admin: Also sends OTP to phone
    """
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Initialize tables
    init_password_reset_table(db)
    
    # Rate limiting check
    if not check_rate_limit(data.email, ip_address):
        log_audit_event(db, data.email, data.admin_type, "forgot_password_rate_limited",
                       ip_address, user_agent, False, "Rate limit exceeded")
        raise HTTPException(status_code=429, detail="Too many reset attempts. Please try again later.")
    
    record_attempt(data.email, ip_address)
    
    try:
        cursor = db.cursor()
        phone_number = None
        user_id = None
        bank_id = None
        branch_id = None
        
        if data.admin_type == 'bank_admin':
            # Check bank_admins table first
            cursor.execute('''
                SELECT ba.id, ba.phone, ba.bank_id
                FROM bank_admins ba
                WHERE ba.email = %s AND ba.is_active = TRUE
            ''', (data.email,))
            admin = cursor.fetchone()
            
            if admin:
                user_id = admin[0]
                phone_number = admin[1]
                bank_id = admin[2]
            else:
                # Fallback to tenant_users
                cursor.execute('''
                    SELECT tu.id, tu.phone, tu.bank_id
                    FROM tenant_users tu
                    WHERE tu.email = %s AND tu.user_role = 'bank_admin' AND tu.is_active = TRUE
                ''', (data.email,))
                user = cursor.fetchone()
                if user:
                    user_id = user[0]
                    phone_number = user[1]
                    bank_id = user[2]
                    
        elif data.admin_type == 'branch_admin':
            # Check branches table
            cursor.execute('''
                SELECT b.id, b.contact_phone, b.bank_id
                FROM branches b
                WHERE b.contact_email = %s AND b.is_active = TRUE
            ''', (data.email,))
            branch = cursor.fetchone()
            
            if branch:
                branch_id = branch[0]
                phone_number = branch[1]
                bank_id = branch[2]
        
        if not user_id and not branch_id:
            # Don't reveal if email exists or not (security best practice)
            log_audit_event(db, data.email, data.admin_type, "forgot_password_email_not_found",
                           ip_address, user_agent, False, "Email not found")
            cursor.close()
            return ForgotPasswordResponse(
                success=True,  # Always return success to prevent email enumeration
                message="If this email exists in our system, you will receive a password reset link shortly.",
                requires_otp=data.admin_type == 'bank_admin'
            )
        
        # Invalidate any existing reset tokens for this user
        cursor.execute('''
            UPDATE password_reset_tokens 
            SET used = TRUE 
            WHERE user_email = %s AND used = FALSE
        ''', (data.email,))
        
        # Generate secure token
        raw_token, token_hash = generate_secure_token()
        
        # Generate OTP for bank_admin
        raw_otp = None
        otp_hash = None
        otp_expires_at = None
        
        if data.admin_type == 'bank_admin':
            raw_otp, otp_hash = generate_otp()
            otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
        
        # Calculate expiry
        expires_at = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)
        
        # Store token in database
        cursor.execute('''
            INSERT INTO password_reset_tokens 
            (user_id, user_email, user_type, bank_id, branch_id, token_hash, otp_hash, 
             expires_at, otp_expires_at, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (user_id, data.email, data.admin_type, bank_id, branch_id, 
              token_hash, otp_hash, expires_at, otp_expires_at, ip_address, user_agent))
        
        db.commit()
        cursor.close()
        
        # Generate reset link
        reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"
        
        # Send password reset email
        email_sent = send_reset_email(data.email, reset_link, data.admin_type)
        
        # Send OTP for bank_admin (via email as SMS fallback)
        otp_sent = False
        if raw_otp:
            otp_sent = send_otp_email(data.email, raw_otp, data.admin_type)
            # Log OTP for development/testing (remove in production!)
            logger.info(f"[DEV] OTP for {data.email}: {raw_otp}")
        
        log_audit_event(db, data.email, data.admin_type, "forgot_password_initiated",
                       ip_address, user_agent, True, metadata={"bank_id": bank_id, "email_sent": email_sent})
        
        # Build response message
        if email_sent:
            message = "Password reset link has been sent to your email."
            if raw_otp:
                message += " An OTP has also been sent to your email for verification."
        else:
            message = "Password reset initiated. Check console logs for reset link (DEV MODE)."
            if raw_otp:
                message += f" OTP (DEV MODE): {raw_otp}"
        
        return ForgotPasswordResponse(
            success=True,
            message=message,
            requires_otp=data.admin_type == 'bank_admin'
        )
        
    except Exception as e:
        logger.error(f"Error in forgot_password: {e}")
        log_audit_event(db, data.email, data.admin_type, "forgot_password_error",
                       ip_address, user_agent, False, str(e))
        raise HTTPException(status_code=500, detail="An error occurred. Please try again.")

@router.post("/validate-token", response_model=ValidateResetTokenResponse)
async def validate_reset_token(
    request: Request,
    data: ValidateResetTokenRequest,
    db = Depends(get_db)
):
    """
    Step 2: Validate reset token from URL
    - Checks token validity
    - Checks expiration
    - Returns user info and OTP requirement
    """
    ip_address = request.client.host if request.client else "unknown"
    
    try:
        # Hash the provided token
        token_hash = hashlib.sha256(data.token.encode()).hexdigest()
        
        cursor = db.cursor()
        cursor.execute('''
            SELECT user_email, user_type, bank_id, branch_id, expires_at, used, otp_hash
            FROM password_reset_tokens
            WHERE token_hash = %s
        ''', (token_hash,))
        
        result = cursor.fetchone()
        cursor.close()
        
        if not result:
            return ValidateResetTokenResponse(
                valid=False,
                message="Invalid or expired reset link."
            )
        
        email, user_type, bank_id, branch_id, expires_at, used, otp_hash = result
        
        # Check if already used
        if used:
            return ValidateResetTokenResponse(
                valid=False,
                message="This reset link has already been used."
            )
        
        # Check expiration
        if datetime.utcnow() > expires_at:
            return ValidateResetTokenResponse(
                valid=False,
                message="This reset link has expired. Please request a new one."
            )
        
        return ValidateResetTokenResponse(
            valid=True,
            email=email,
            admin_type=user_type,
            requires_otp=user_type == 'bank_admin' and otp_hash is not None,
            message="Token is valid."
        )
        
    except Exception as e:
        logger.error(f"Error validating token: {e}")
        return ValidateResetTokenResponse(
            valid=False,
            message="Error validating reset link."
        )

@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: Request,
    data: ResetPasswordRequest,
    db = Depends(get_db)
):
    """
    Step 3: Reset password
    - Validates token
    - Validates OTP (for bank_admin)
    - Updates password
    - Invalidates token
    - Logs audit event
    """
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Password validation
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    
    try:
        # Hash the provided token
        token_hash = hashlib.sha256(data.token.encode()).hexdigest()
        
        cursor = db.cursor()
        cursor.execute('''
            SELECT id, user_id, user_email, user_type, bank_id, branch_id, 
                   expires_at, used, otp_hash, otp_expires_at
            FROM password_reset_tokens
            WHERE token_hash = %s
        ''', (token_hash,))
        
        result = cursor.fetchone()
        
        if not result:
            log_audit_event(db, "unknown", "unknown", "reset_password_invalid_token",
                           ip_address, user_agent, False, "Invalid token")
            cursor.close()
            raise HTTPException(status_code=400, detail="Invalid or expired reset link.")
        
        (token_id, user_id, email, user_type, bank_id, branch_id, 
         expires_at, used, otp_hash, otp_expires_at) = result
        
        # Check if already used
        if used:
            log_audit_event(db, email, user_type, "reset_password_token_reused",
                           ip_address, user_agent, False, "Token already used")
            cursor.close()
            raise HTTPException(status_code=400, detail="This reset link has already been used.")
        
        # Check expiration
        if datetime.utcnow() > expires_at:
            log_audit_event(db, email, user_type, "reset_password_token_expired",
                           ip_address, user_agent, False, "Token expired")
            cursor.close()
            raise HTTPException(status_code=400, detail="This reset link has expired.")
        
        # Validate OTP for bank_admin
        if user_type == 'bank_admin' and otp_hash:
            if not data.otp:
                cursor.close()
                raise HTTPException(status_code=400, detail="OTP is required for bank admin password reset.")
            
            # Check OTP expiration
            if otp_expires_at and datetime.utcnow() > otp_expires_at:
                log_audit_event(db, email, user_type, "reset_password_otp_expired",
                               ip_address, user_agent, False, "OTP expired")
                cursor.close()
                raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
            
            # Verify OTP
            provided_otp_hash = hashlib.sha256(data.otp.encode()).hexdigest()
            if provided_otp_hash != otp_hash:
                log_audit_event(db, email, user_type, "reset_password_invalid_otp",
                               ip_address, user_agent, False, "Invalid OTP")
                cursor.close()
                raise HTTPException(status_code=400, detail="Invalid OTP.")
        
        # Hash new password
        new_password_hash = hash_password(data.new_password)
        
        # Update password based on user type
        if user_type == 'bank_admin':
            # Try bank_admins table first
            cursor.execute('''
                UPDATE bank_admins 
                SET password_hash = %s, password_changed_at = %s, updated_at = %s
                WHERE email = %s AND is_active = TRUE
            ''', (new_password_hash, datetime.utcnow(), datetime.utcnow(), email))
            
            if cursor.rowcount == 0:
                # Fallback to tenant_users (store in a password field if exists)
                # For now, create bank_admin entry
                cursor.execute('''
                    INSERT INTO bank_admins (bank_id, email, password_hash, password_changed_at)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (bank_id, email) 
                    DO UPDATE SET password_hash = %s, password_changed_at = %s, updated_at = %s
                ''', (bank_id, email, new_password_hash, datetime.utcnow(),
                      new_password_hash, datetime.utcnow(), datetime.utcnow()))
                      
        elif user_type == 'branch_admin':
            # Update branch contact_phone as password for branch admin
            # In production, you'd have a proper branch_admins table
            cursor.execute('''
                UPDATE branches 
                SET contact_phone = %s, updated_at = %s
                WHERE contact_email = %s AND is_active = TRUE
            ''', (data.new_password, datetime.utcnow(), email))  # Store actual password for branch
        
        # Invalidate token (mark as used)
        cursor.execute('''
            UPDATE password_reset_tokens 
            SET used = TRUE 
            WHERE id = %s
        ''', (token_id,))
        
        db.commit()
        cursor.close()
        
        log_audit_event(db, email, user_type, "password_reset_successful",
                       ip_address, user_agent, True, 
                       metadata={"bank_id": bank_id, "branch_id": branch_id})
        
        logger.info(f"Password reset successful for {email} ({user_type})")
        
        return ResetPasswordResponse(
            success=True,
            message="Password has been reset successfully. You can now login with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while resetting password.")

@router.post("/resend-otp", response_model=ResendOTPResponse)
async def resend_otp(
    request: Request,
    data: ResendOTPRequest,
    db = Depends(get_db)
):
    """
    Resend OTP for bank admin password reset
    """
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Hash the provided token
        token_hash = hashlib.sha256(data.token.encode()).hexdigest()
        
        cursor = db.cursor()
        cursor.execute('''
            SELECT id, user_email, user_type, expires_at, used
            FROM password_reset_tokens
            WHERE token_hash = %s
        ''', (token_hash,))
        
        result = cursor.fetchone()
        
        if not result:
            cursor.close()
            return ResendOTPResponse(success=False, message="Invalid reset link.")
        
        token_id, email, user_type, expires_at, used = result
        
        if used or datetime.utcnow() > expires_at:
            cursor.close()
            return ResendOTPResponse(success=False, message="Reset link has expired.")
        
        if user_type != 'bank_admin':
            cursor.close()
            return ResendOTPResponse(success=False, message="OTP is only required for bank admins.")
        
        # Generate new OTP
        raw_otp, otp_hash = generate_otp()
        otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
        
        # Update OTP
        cursor.execute('''
            UPDATE password_reset_tokens 
            SET otp_hash = %s, otp_expires_at = %s
            WHERE id = %s
        ''', (otp_hash, otp_expires_at, token_id))
        
        db.commit()
        cursor.close()
        
        # Send OTP via email
        otp_sent = send_otp_email(email, raw_otp, user_type)
        logger.info(f"[DEV] New OTP for {email}: {raw_otp}")
        
        log_audit_event(db, email, user_type, "otp_resent",
                       ip_address, user_agent, True)
        
        if otp_sent:
            return ResendOTPResponse(
                success=True,
                message="A new OTP has been sent to your email."
            )
        else:
            return ResendOTPResponse(
                success=True,
                message=f"OTP generated (DEV MODE): {raw_otp}"
            )
        
    except Exception as e:
        logger.error(f"Error resending OTP: {e}")
        return ResendOTPResponse(success=False, message="Failed to resend OTP.")

@router.get("/audit-log/{email}")
async def get_audit_log(
    email: str,
    limit: int = 50,
    db = Depends(get_db)
):
    """
    Get password reset audit log for an email (Admin only)
    """
    try:
        cursor = db.cursor()
        cursor.execute('''
            SELECT id, user_email, user_type, action, ip_address, success, 
                   error_message, created_at
            FROM password_reset_audit_log
            WHERE user_email = %s
            ORDER BY created_at DESC
            LIMIT %s
        ''', (email, limit))
        
        rows = cursor.fetchall()
        cursor.close()
        
        logs = []
        for row in rows:
            logs.append({
                "id": row[0],
                "email": row[1],
                "user_type": row[2],
                "action": row[3],
                "ip_address": row[4],
                "success": row[5],
                "error_message": row[6],
                "timestamp": row[7].isoformat() if row[7] else None
            })
        
        return {"logs": logs, "total": len(logs)}
        
    except Exception as e:
        logger.error(f"Error fetching audit log: {e}")
        raise HTTPException(status_code=500, detail="Error fetching audit log.")
