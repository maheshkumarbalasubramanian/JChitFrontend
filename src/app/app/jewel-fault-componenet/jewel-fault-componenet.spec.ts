import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JewelFaultComponenet } from './jewel-fault-component';

describe('JewelFaultComponenet', () => {
  let component: JewelFaultComponenet;
  let fixture: ComponentFixture<JewelFaultComponenet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JewelFaultComponenet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JewelFaultComponenet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
