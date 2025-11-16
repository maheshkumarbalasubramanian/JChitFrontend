import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurityComponent } from './purity-component';

describe('PurityComponent', () => {
  let component: PurityComponent;
  let fixture: ComponentFixture<PurityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
