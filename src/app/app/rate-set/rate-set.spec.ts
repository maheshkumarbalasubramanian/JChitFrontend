import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateSet } from './rate-set';

describe('RateSet', () => {
  let component: RateSet;
  let fixture: ComponentFixture<RateSet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RateSet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RateSet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
