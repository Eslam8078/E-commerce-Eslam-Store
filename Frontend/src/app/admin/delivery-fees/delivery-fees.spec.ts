import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveryFees } from './delivery-fees';

describe('DeliveryFees', () => {
  let component: DeliveryFees;
  let fixture: ComponentFixture<DeliveryFees>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DeliveryFees] }).compileComponents();
    fixture = TestBed.createComponent(DeliveryFees);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
