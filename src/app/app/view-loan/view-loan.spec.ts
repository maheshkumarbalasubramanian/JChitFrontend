import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLoan } from './view-loan';

describe('ViewLoan', () => {
  let component: ViewLoan;
  let fixture: ComponentFixture<ViewLoan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewLoan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewLoan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
