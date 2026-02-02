/**
 * Bank Selector Component
 * Allows users to select a bank from available options
 */

import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Bank } from '../../types/tenant';
import { useTenant } from '../../contexts/TenantContext';

interface BankSelectorProps {
  selectedBankId?: number;
  onBankChange?: (bank: Bank | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  selectedBankId,
  onBankChange,
  disabled = false,
  placeholder = "Select a bank...",
  className = "",
}) => {
  const { state, selectBank } = useTenant();
  const { availableBanks, isLoadingBanks } = state;

  const handleBankSelect = async (bankId: string) => {
    const selectedBank = availableBanks.find(bank => bank.id.toString() === bankId) || null;
    
    // Update internal state
    await selectBank(selectedBank);
    
    // Call external handler if provided
    if (onBankChange) {
      onBankChange(selectedBank);
    }
  };

  const currentValue = selectedBankId?.toString() || state.currentBank?.id?.toString() || "";

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Bank
      </label>
      <Select
        value={currentValue}
        onValueChange={handleBankSelect}
        disabled={disabled || isLoadingBanks}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoadingBanks ? "Loading banks..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableBanks.map((bank) => (
            <SelectItem key={bank.id} value={bank.id.toString()}>
              <div className="flex flex-col">
                <span className="font-medium">{bank.bank_short_name}</span>
                <span className="text-xs text-gray-500">{bank.bank_name}</span>
              </div>
            </SelectItem>
          ))}
          {availableBanks.length === 0 && !isLoadingBanks && (
            <SelectItem value="no-banks" disabled>
              No banks available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BankSelector;