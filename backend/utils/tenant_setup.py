"""
Tenant Setup and Migration Utilities for Gold Loan Appraisal System

This module provides utilities for:
1. Setting up initial tenant hierarchy (banks and branches)
2. Migrating legacy data to the new tenant structure
3. Creating sample data for testing
"""

import sys
import os
from pathlib import Path
from typing import Dict, List, Any
import json

# Add Backend directory to path
backend_path = Path(__file__).parent.parent
sys.path.append(str(backend_path))

from models.database import Database

class TenantSetup:
    def __init__(self):
        """Initialize tenant setup with database connection"""
        self.db = Database()
    
    def create_sample_banks_and_branches(self) -> Dict[str, Any]:
        """Create sample banks and branches for testing"""
        
        # Sample bank configurations
        banks_config = [
            {
                "bank_code": "SBI",
                "bank_name": "State Bank of India",
                "bank_short_name": "SBI",
                "headquarters_address": "State Bank Bhavan, Nariman Point, Mumbai - 400021",
                "contact_email": "goldloans@sbi.co.in",
                "contact_phone": "+91-22-2285-5000",
                "rbi_license_number": "RBI-SBI-001",
                "branches": [
                    {
                        "branch_code": "MAIN_BR",
                        "branch_name": "Main Branch Mumbai",
                        "branch_address": "Fort, Mumbai - 400001",
                        "branch_city": "Mumbai",
                        "branch_state": "Maharashtra",
                        "branch_pincode": "400001",
                        "contact_phone": "+91-22-2266-1234",
                        "manager_name": "Mr. Rajesh Kumar",
                        "latitude": 18.9375,
                        "longitude": 72.8347
                    },
                    {
                        "branch_code": "BKC_BR", 
                        "branch_name": "Bandra Kurla Complex Branch",
                        "branch_address": "BKC, Mumbai - 400051",
                        "branch_city": "Mumbai",
                        "branch_state": "Maharashtra",
                        "branch_pincode": "400051",
                        "contact_phone": "+91-22-2659-1234",
                        "manager_name": "Ms. Priya Sharma",
                        "latitude": 19.0576,
                        "longitude": 72.8697
                    }
                ]
            },
            {
                "bank_code": "HDFC",
                "bank_name": "HDFC Bank Limited",
                "bank_short_name": "HDFC Bank",
                "headquarters_address": "HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai - 400013",
                "contact_email": "goldloans@hdfcbank.com",
                "contact_phone": "+91-22-6160-6161",
                "rbi_license_number": "RBI-HDFC-002",
                "branches": [
                    {
                        "branch_code": "ANDHERI_BR",
                        "branch_name": "Andheri West Branch",
                        "branch_address": "Andheri West, Mumbai - 400053",
                        "branch_city": "Mumbai",
                        "branch_state": "Maharashtra", 
                        "branch_pincode": "400053",
                        "contact_phone": "+91-22-2673-1234",
                        "manager_name": "Mr. Amit Patel",
                        "latitude": 19.1358,
                        "longitude": 72.8269
                    },
                    {
                        "branch_code": "POWAI_BR",
                        "branch_name": "Powai Branch",
                        "branch_address": "Powai, Mumbai - 400076",
                        "branch_city": "Mumbai", 
                        "branch_state": "Maharashtra",
                        "branch_pincode": "400076",
                        "contact_phone": "+91-22-2857-1234",
                        "manager_name": "Ms. Sneha Iyer",
                        "latitude": 19.1197,
                        "longitude": 72.9059
                    }
                ]
            },
            {
                "bank_code": "ICICI",
                "bank_name": "ICICI Bank Limited", 
                "bank_short_name": "ICICI Bank",
                "headquarters_address": "ICICI Bank Towers, BKC, Mumbai - 400051",
                "contact_email": "goldloans@icicibank.com",
                "contact_phone": "+91-22-2653-1414",
                "rbi_license_number": "RBI-ICICI-003",
                "branches": [
                    {
                        "branch_code": "WORLI_BR",
                        "branch_name": "Worli Branch",
                        "branch_address": "Worli, Mumbai - 400025",
                        "branch_city": "Mumbai",
                        "branch_state": "Maharashtra",
                        "branch_pincode": "400025", 
                        "contact_phone": "+91-22-2493-1234",
                        "manager_name": "Mr. Karthik Nair",
                        "latitude": 19.0133,
                        "longitude": 72.8184
                    }
                ]
            }
        ]
        
        created_data = {"banks": [], "branches": [], "users": []}
        
        try:
            for bank_config in banks_config:
                # Check if bank already exists
                existing_bank = None
                try:
                    conn = self.db.get_connection()
                    cursor = conn.cursor()
                    cursor.execute("SELECT id FROM banks WHERE bank_code = %s", (bank_config["bank_code"],))
                    result = cursor.fetchone()
                    if result:
                        existing_bank = result[0]
                        print(f"Bank {bank_config['bank_code']} already exists (ID: {existing_bank})")
                    cursor.close()
                    conn.close()
                except Exception as e:
                    print(f"Error checking for existing bank: {e}")
                
                # Create bank only if it doesn't exist
                if existing_bank:
                    bank_id = existing_bank
                else:
                    bank_id = self.db.create_bank(
                        bank_code=bank_config["bank_code"],
                        bank_name=bank_config["bank_name"],
                        bank_short_name=bank_config["bank_short_name"],
                        headquarters_address=bank_config["headquarters_address"],
                        contact_email=bank_config["contact_email"],
                        contact_phone=bank_config["contact_phone"],
                        rbi_license_number=bank_config["rbi_license_number"],
                        system_configuration={
                            "max_loan_amount": 10000000,  # 1 Crore
                            "min_loan_amount": 5000,      # 5K
                            "interest_rate_range": {"min": 8.5, "max": 15.0},
                            "loan_to_value_ratio": 0.75
                        },
                    tenant_settings={
                        "allow_online_appraisal": True,
                        "require_customer_photo": True,
                        "gps_verification_required": True,
                        "facial_recognition_enabled": True
                    }
                )
                
                created_data["banks"].append({
                    "id": bank_id,
                    "code": bank_config["bank_code"],
                    "name": bank_config["bank_name"]
                })
                
                # Create branches for this bank
                for branch_config in bank_config["branches"]:
                    # Check if branch already exists
                    existing_branch = None
                    try:
                        conn = self.db.get_connection()
                        cursor = conn.cursor()
                        cursor.execute("SELECT id FROM branches WHERE bank_id = %s AND branch_code = %s", 
                                     (bank_id, branch_config["branch_code"]))
                        result = cursor.fetchone()
                        if result:
                            existing_branch = result[0]
                            print(f"Branch {branch_config['branch_code']} already exists for bank {bank_config['bank_code']} (ID: {existing_branch})")
                        cursor.close()
                        conn.close()
                    except Exception as e:
                        print(f"Error checking for existing branch: {e}")
                    
                    # Create branch only if it doesn't exist
                    if existing_branch:
                        branch_id = existing_branch
                    else:
                        branch_id = self.db.create_branch(
                            bank_id=bank_id,
                            branch_code=branch_config["branch_code"],
                            branch_name=branch_config["branch_name"],
                            branch_address=branch_config["branch_address"],
                            branch_city=branch_config["branch_city"],
                            branch_state=branch_config["branch_state"],
                            branch_pincode=branch_config["branch_pincode"],
                            contact_phone=branch_config["contact_phone"],
                            manager_name=branch_config["manager_name"],
                            latitude=branch_config["latitude"],
                            longitude=branch_config["longitude"],
                            operational_hours={
                                "monday": {"open": "09:30", "close": "16:00"},
                            "tuesday": {"open": "09:30", "close": "16:00"},
                            "wednesday": {"open": "09:30", "close": "16:00"},
                            "thursday": {"open": "09:30", "close": "16:00"},
                            "friday": {"open": "09:30", "close": "16:00"},
                            "saturday": {"open": "09:30", "close": "13:00"},
                            "sunday": {"open": None, "close": None}
                        }
                    )
                    
                    created_data["branches"].append({
                        "id": branch_id,
                        "bank_id": bank_id,
                        "code": branch_config["branch_code"],
                        "name": branch_config["branch_name"]
                    })
                    
                    # Create sample users/appraisers for this branch
                    sample_users = self._create_sample_users(bank_id, branch_id, bank_config["bank_code"], branch_config["branch_code"])
                    created_data["users"].extend(sample_users)
            
            print(f"Successfully created {len(created_data['banks'])} banks, {len(created_data['branches'])} branches, and {len(created_data['users'])} users")
            return created_data
            
        except Exception as e:
            print(f"Error creating sample data: {e}")
            raise e
    
    def _create_sample_users(self, bank_id: int, branch_id: int, bank_code: str, branch_code: str) -> List[Dict[str, Any]]:
        """Create sample tenant users for a branch"""
        users = []
        
        # Sample user configurations  
        user_configs = [
            {
                "user_id": f"APP{bank_code}001",
                "full_name": "Rajesh Kumar Singh",
                "email": f"rajesh.singh@{bank_code.lower()}.com",
                "phone": "+91-9876543210",
                "employee_id": f"EMP{bank_code}001",
                "designation": "Senior Appraiser",
                "user_role": "senior_appraiser"
            },
            {
                "user_id": f"APP{bank_code}002", 
                "full_name": "Priya Sharma Patel",
                "email": f"priya.patel@{bank_code.lower()}.com",
                "phone": "+91-9876543211",
                "employee_id": f"EMP{bank_code}002",
                "designation": "Gold Appraiser",
                "user_role": "appraiser"
            }
        ]
        
        try:
            for user_config in user_configs:
                tenant_user_id = self.db.create_tenant_user(
                    user_id=user_config["user_id"],
                    bank_id=bank_id,
                    branch_id=branch_id,
                    full_name=user_config["full_name"],
                    email=user_config["email"],
                    phone=user_config["phone"],
                    employee_id=user_config["employee_id"],
                    designation=user_config["designation"],
                    user_role=user_config["user_role"],
                    permissions={
                        "can_create_sessions": True,
                        "can_view_reports": True,
                        "can_approve_loans": user_config["user_role"] == "senior_appraiser",
                        "max_loan_amount": 5000000 if user_config["user_role"] == "senior_appraiser" else 1000000
                    }
                )
                
                users.append({
                    "id": tenant_user_id,
                    "user_id": user_config["user_id"],
                    "name": user_config["full_name"],
                    "bank_id": bank_id,
                    "branch_id": branch_id
                })
                
        except Exception as e:
            print(f"Error creating sample users: {e}")
            
        return users
    
    def migrate_existing_data(self) -> Dict[str, int]:
        """Migrate existing legacy data to tenant hierarchy"""
        try:
            migrated_count = self.db.migrate_legacy_bank_branch_data()
            print(f"Successfully migrated {migrated_count} bank/branch combinations")
            return {"migrated_combinations": migrated_count}
        except Exception as e:
            print(f"Error during migration: {e}")
            raise e
    
    def setup_complete_tenant_system(self) -> Dict[str, Any]:
        """Complete setup of tenant system with sample data"""
        print("Starting complete tenant system setup...")
        
        try:
            # Step 1: Create sample banks and branches
            print("Step 1: Creating sample banks and branches...")
            sample_data = self.create_sample_banks_and_branches()
            
            # Step 2: Migrate existing data
            print("Step 2: Migrating existing legacy data...")
            migration_result = self.migrate_existing_data()
            
            # Step 3: Verify setup
            print("Step 3: Verifying setup...")
            banks = self.db.get_all_banks()
            total_branches = 0
            total_users = 0
            
            for bank in banks:
                branches = self.db.get_branches_by_bank(bank['id'])
                users = self.db.get_tenant_users_by_bank(bank['id'])
                total_branches += len(branches)
                total_users += len(users)
                print(f"  Bank: {bank['bank_name']} - {len(branches)} branches, {len(users)} users")
            
            result = {
                "status": "success",
                "setup_summary": {
                    "total_banks": len(banks),
                    "total_branches": total_branches,
                    "total_users": total_users
                },
                "sample_data": sample_data,
                "migration_result": migration_result
            }
            
            print("✅ Tenant system setup completed successfully!")
            return result
            
        except Exception as e:
            print(f"❌ Error during tenant system setup: {e}")
            raise e
    
    def get_tenant_hierarchy_summary(self) -> Dict[str, Any]:
        """Get a summary of the current tenant hierarchy"""
        try:
            banks = self.db.get_all_banks()
            hierarchy = []
            
            for bank in banks:
                branches = self.db.get_branches_by_bank(bank['id'])
                branch_list = []
                
                for branch in branches:
                    users = self.db.get_tenant_users_by_branch(branch['id'])
                    branch_list.append({
                        "branch_id": branch['id'],
                        "branch_code": branch['branch_code'],
                        "branch_name": branch['branch_name'],
                        "branch_city": branch['branch_city'],
                        "user_count": len(users),
                        "users": [{"user_id": u['user_id'], "full_name": u['full_name'], "designation": u['designation']} for u in users]
                    })
                
                hierarchy.append({
                    "bank_id": bank['id'],
                    "bank_code": bank['bank_code'],
                    "bank_name": bank['bank_name'],
                    "branch_count": len(branches),
                    "branches": branch_list
                })
            
            return {
                "total_banks": len(banks),
                "hierarchy": hierarchy
            }
            
        except Exception as e:
            print(f"Error getting tenant hierarchy summary: {e}")
            raise e

def main():
    """Main function for running tenant setup"""
    print("Gold Loan Appraisal - Tenant Setup Utility")
    print("=" * 50)
    
    setup = TenantSetup()
    
    try:
        # Test database connection
        if not setup.db.test_connection():
            print("❌ Database connection failed!")
            return
        
        print("✅ Database connection successful")
        
        # Run complete setup
        result = setup.setup_complete_tenant_system()
        
        # Print summary
        print("\n" + "=" * 50)
        print("SETUP SUMMARY")
        print("=" * 50)
        print(json.dumps(result, indent=2, default=str))
        
        # Get and print hierarchy
        print("\n" + "=" * 50)
        print("TENANT HIERARCHY")
        print("=" * 50)
        hierarchy = setup.get_tenant_hierarchy_summary()
        
        for bank_info in hierarchy["hierarchy"]:
            print(f"\n🏦 {bank_info['bank_name']} ({bank_info['bank_code']})")
            for branch_info in bank_info["branches"]:
                print(f"  🏢 {branch_info['branch_name']} ({branch_info['branch_code']})")
                for user_info in branch_info["users"]:
                    print(f"    👤 {user_info['full_name']} - {user_info['designation']} [{user_info['user_id']}]")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return 1
    
    print("\n🎉 Tenant setup completed successfully!")
    return 0

if __name__ == "__main__":
    exit(main())