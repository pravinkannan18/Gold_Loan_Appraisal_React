import React from 'react';
import { ModernDashboardLayout } from '../components/layouts/ModernDashboardLayout';
import { BankBranchAdmin } from '../components/admin/BankBranchAdmin';
import { Building2 } from 'lucide-react';

export function BankBranchAdministration() {
  return (
    <ModernDashboardLayout
      title="Bank & Branch Administration"
      subtitle="Manage your banking network information"
      headerContent={
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">Administration Panel</span>
        </div>
      }
    >
      <BankBranchAdmin />
    </ModernDashboardLayout>
  );
}

export default BankBranchAdministration;