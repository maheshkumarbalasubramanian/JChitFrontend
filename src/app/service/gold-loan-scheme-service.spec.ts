import { TestBed } from '@angular/core/testing';

import { GoldLoanSchemeService } from './gold-loan-scheme-service';

describe('GoldLoanSchemeService', () => {
  let service: GoldLoanSchemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoldLoanSchemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
