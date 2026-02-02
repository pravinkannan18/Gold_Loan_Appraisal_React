/**
 * Tenant Information Card - Shows current bank/branch details with management access
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTenant } from '../contexts/TenantContext';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Users, 
  Settings, 
  Phone, 
  Mail, 
  Clock,
  ExternalLink,
  Edit
} from 'lucide-react';

export const TenantInfoCard: React.FC = () => {
  const { selectedBank, selectedBranch, user, permissions } = useTenant();

  if (!selectedBank) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Building2 className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-600">No bank selected</p>
          <p className="text-sm text-gray-500">Use the tenant selector to choose your bank</p>
        </CardContent>
      </Card>
    );
  }

  const canManage = permissions.canManageTenants;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Current Organization
          </CardTitle>
          {canManage && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <Settings className="w-4 h-4 mr-1" />
                  Manage
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Information */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {selectedBank.bank_short_name}
            </h4>
            <Badge variant={selectedBank.is_active ? 'default' : 'secondary'}>
              {selectedBank.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Code:</strong> {selectedBank.bank_code}</p>
            <p><strong>Full Name:</strong> {selectedBank.bank_name}</p>
            <p><strong>RBI License:</strong> {selectedBank.rbi_license_number}</p>
            
            {/* Contact Information */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{selectedBank.contact_phone}</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{selectedBank.contact_email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Information */}
        {selectedBranch && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {selectedBranch.branch_name}
              </h4>
              <Badge variant={selectedBranch.is_active ? 'default' : 'secondary'}>
                {selectedBranch.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Code:</strong> {selectedBranch.branch_code}</p>
              <p><strong>Pincode:</strong> {selectedBranch.pincode}</p>
              <p><strong>Address:</strong> {selectedBranch.branch_address}</p>
              
              {/* Branch Contact */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{selectedBranch.contact_phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{selectedBranch.contact_email}</span>
                </div>
              </div>

              {/* Operational Hours */}
              {selectedBranch.operational_hours && (
                <div className="pt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">Today's Hours:</span>
                  </div>
                  {(() => {
                    const today = new Date().toLocaleLowerCase().slice(0, 3) + 
                                new Date().toLocaleLowerCase().slice(3);
                    const todaySchedule = selectedBranch.operational_hours[today];
                    if (todaySchedule?.is_open) {
                      return (
                        <span className="text-green-600">
                          {todaySchedule.open} - {todaySchedule.close}
                        </span>
                      );
                    }
                    return <span className="text-red-500">Closed</span>;
                  })()}
                </div>
              )}

              {/* Branch Manager */}
              {selectedBranch.branch_manager_name && (
                <div className="pt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="w-3 h-3" />
                    <span className="font-medium">Manager:</span>
                  </div>
                  <p>{selectedBranch.branch_manager_name}</p>
                  {selectedBranch.branch_manager_phone && (
                    <p className="text-xs">{selectedBranch.branch_manager_phone}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Configuration */}
        {selectedBank.system_configuration && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Loan Configuration</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Max Loan:</span>
                <p>₹{selectedBank.system_configuration.max_loan_amount?.toLocaleString() || 'Not set'}</p>
              </div>
              <div>
                <span className="font-medium">Min Loan:</span>
                <p>₹{selectedBank.system_configuration.min_loan_amount?.toLocaleString() || 'Not set'}</p>
              </div>
              <div className="col-span-2">
                <span className="font-medium">LTV Ratio:</span>
                <p>{((selectedBank.system_configuration.loan_to_value_ratio || 0) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
          <div className="flex gap-2 flex-wrap">
            {canManage && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin" state={{ tab: 'banks' }}>
                    <Edit className="w-3 h-3 mr-1" />
                    Edit Bank
                  </Link>
                </Button>
                {selectedBranch && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin" state={{ tab: 'branches' }}>
                      <Edit className="w-3 h-3 mr-1" />
                      Edit Branch
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin" state={{ tab: 'users' }}>
                    <Users className="w-3 h-3 mr-1" />
                    Manage Users
                  </Link>
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/tenant-management">
                <ExternalLink className="w-3 h-3 mr-1" />
                Switch Tenant
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantInfoCard;