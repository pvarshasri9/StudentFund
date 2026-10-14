import React from 'react';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  showSign?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency = '₹',
  className = '',
  showSign = false
}) => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN');

  const sign = showSign ? (amount > 0 ? '+' : amount < 0 ? '-' : '') : (isNegative ? '-' : '');

  return (
    <span className={`inline-flex items-baseline font-medium ${className}`}>
      {sign && <span className="mr-0.5">{sign}</span>}
      <span className="text-opacity-80 mr-0.5">{currency}</span>
      <span>{formatted}</span>
    </span>
  );
};
