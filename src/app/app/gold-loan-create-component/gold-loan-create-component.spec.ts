import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoldLoanCreateComponent } from './gold-loan-create-component';

describe('GoldLoanCreateComponent', () => {
  let component: GoldLoanCreateComponent;
  let fixture: ComponentFixture<GoldLoanCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoldLoanCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoldLoanCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
