// src/utils/pricingUtils.js
export const calculatePricingRange = (price) => {
  if (price >= 20 && price <= 50) return '20-50';
  if (price >= 51 && price <= 100) return '51-100';
  if (price >= 101 && price <= 150) return '101-150';
  if (price >= 151 && price <= 200) return '151-200';
  return 'Unknown';
};
