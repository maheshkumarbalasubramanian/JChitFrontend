import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemeAddEditComponent } from './scheme-add-edit-component';

describe('SchemeAddEditComponent', () => {
  let component: SchemeAddEditComponent;
  let fixture: ComponentFixture<SchemeAddEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemeAddEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchemeAddEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
