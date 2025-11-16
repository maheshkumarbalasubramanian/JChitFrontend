import { SchemeFormData } from "../service/gold-loan-scheme-service";

export class SchemeUtils {
    static formatCurrency(amount: number): string {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    }
  
    static formatPercentage(value: number): string {
      return `${value.toFixed(2)}%`;
    }
  
    static calculateProcessingFee(loanAmount: number, feePercentage: number): number {
      return (loanAmount * feePercentage) / 100;
    }
  
    static getDaysFromDate(startDate: Date, endDate: Date): number {
      const timeDifference = endDate.getTime() - startDate.getTime();
      return Math.ceil(timeDifference / (1000 * 3600 * 24));
    }
  
    static getSchemeTypeColor(calculationMethod: string): string {
      const colorMap = {
        'Simple': '#27ae60',
        'Compound': '#f39c12',
        'Emi': '#3498db',
        'Multiple': '#9b59b6',
        'Customized': '#e74c3c'
      };
      return colorMap[calculationMethod as keyof typeof colorMap] || '#95a5a6';
    }
  
    static validateSchemeData(scheme: SchemeFormData): string[] {
      const errors: string[] = [];
  
      if (!scheme.schemeName || scheme.schemeName.trim().length < 2) {
        errors.push('Scheme name must be at least 2 characters long');
      }
  
      if (scheme.roi <= 0 || scheme.roi > 100) {
        errors.push('ROI must be between 0.1% and 100%');
      }
  
      if (scheme.minLoanValue >= scheme.maxLoanValue) {
        errors.push('Minimum loan value must be less than maximum loan value');
      }
  
      if (scheme.minMarketValue >= scheme.maxMarketValue) {
        errors.push('Minimum market value must be less than maximum market value');
      }
  
      if (scheme.graceDays > 30) {
        errors.push('Grace days cannot exceed 30 days');
      }
  
      if (scheme.calculationMethod === 'Emi' && (!scheme.emiTenure || scheme.emiTenure < 1)) {
        errors.push('EMI tenure must be at least 1 month');
      }
  
      return errors;
    }
  }