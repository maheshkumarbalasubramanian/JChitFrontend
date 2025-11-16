import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurityAddComponent } from './purity-add-component';

describe('PurityAddComponent', () => {
  let component: PurityAddComponent;
  let fixture: ComponentFixture<PurityAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurityAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurityAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
