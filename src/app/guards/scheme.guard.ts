import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { SchemeService } from '../service/scheme.service';
import { Scheme } from '../service/scheme.service';

export const schemeEditGuard: CanActivateFn = (route) => {
  const schemeService = inject(SchemeService);
  const router = inject(Router);
  const id = route.params['id'];

  if (!id) {
    router.navigate(['/schemes']);
    return false;
  }

  return schemeService.getSchemeById(id).pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/schemes']);
      return of(false);
    })
  );
};

// interfaces/scheme.interface.ts
export interface SchemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface InterestCalculation {
  principal: number;
  interestAmount: number;
  totalAmount: number;
  days: number;
  effectiveRate: number;
}

export interface LoanEligibility {
  isEligible: boolean;
  maxLoanAmount: number;
  processingFee: number;
  interestRate: number;
  scheme: Scheme;
}