import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JewelFaultViewComponent } from './jewel-fault-view-component';

describe('JewelFaultViewComponent', () => {
  let component: JewelFaultViewComponent;
  let fixture: ComponentFixture<JewelFaultViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JewelFaultViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JewelFaultViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
