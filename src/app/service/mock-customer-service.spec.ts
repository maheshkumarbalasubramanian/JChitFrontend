import { TestBed } from '@angular/core/testing';

import { MockCustomerService } from './mock-customer-service';

describe('MockCustomerService', () => {
  let service: MockCustomerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockCustomerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
