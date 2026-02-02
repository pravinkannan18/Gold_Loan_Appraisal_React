/**
 * Branch Selector Component
 * Allows users to select a branch from available options for a given bank
 */

import React, { useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Branch } from '../../types/tenant';
import { useTenant } from '../../contexts/TenantContext';

interface BranchSelectorProps {
  bankId?: number;
  selectedBranchId?: number;
  onBranchChange?: (branch: Branch | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  bankId,
  selectedBranchId,
  onBranchChange,
  disabled = false,
  placeholder = "Select a branch...",
  className = "",
}) => {
  const { state, loadBranches, selectBranch } = useTenant();
  const { availableBranches, isLoadingBranches, currentBank } = state;

  const targetBankId = bankId || currentBank?.id;
  const isDisabled = disabled || !targetBankId || isLoadingBranches;

  // Load branches when bank changes
  useEffect(() => {
    if (targetBankId) {
      loadBranches(targetBankId);
    }
  }, [targetBankId, loadBranches]);

  const handleBranchSelect = async (branchId: string) => {
    const selectedBranch = availableBranches.find(branch => branch.id.toString() === branchId) || null;
    
    // Update internal state
    await selectBranch(selectedBranch);
    
    // Call external handler if provided
    if (onBranchChange) {
      onBranchChange(selectedBranch);
    }
  };

  const currentValue = selectedBranchId?.toString() || state.currentBranch?.id?.toString() || "";

  const getPlaceholderText = () => {
    if (!targetBankId) return "Select a bank first";
    if (isLoadingBranches) return "Loading branches...";
    return placeholder;
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Branch
      </label>
      <Select
        value={currentValue}
        onValueChange={handleBranchSelect}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={getPlaceholderText()} />
        </SelectTrigger>
        <SelectContent>
          {availableBranches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id.toString()}>
              <div className="flex flex-col">
                <span className="font-medium">{branch.branch_name}</span>
                <span className="text-xs text-gray-500">
                  {branch.branch_city}, {branch.branch_state} - {branch.branch_pincode}
                </span>
              </div>
            </SelectItem>
          ))}
          {availableBranches.length === 0 && !isLoadingBranches && targetBankId && (
            <SelectItem value="no-branches" disabled>
              No branches available for this bank
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BranchSelector;