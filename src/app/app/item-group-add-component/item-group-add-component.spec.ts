import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemGroupAddComponent } from './item-group-add-component';

describe('ItemGroupAddComponent', () => {
  let component: ItemGroupAddComponent;
  let fixture: ComponentFixture<ItemGroupAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemGroupAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemGroupAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
