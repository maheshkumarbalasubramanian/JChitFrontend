import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCustomer } from './view-customer';

describe('ViewCustomer', () => {
  let component: ViewCustomer;
  let fixture: ComponentFixture<ViewCustomer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewCustomer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewCustomer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
