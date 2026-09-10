import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ListDeliveryFees } from './list-delivery-fees';

describe('ListDeliveryFees', () => {
  let component: ListDeliveryFees;
  let fixture: ComponentFixture<ListDeliveryFees>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListDeliveryFees],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListDeliveryFees);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
