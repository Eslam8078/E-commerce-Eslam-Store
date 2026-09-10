import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AddDeliveryFee } from './add-delivery-fee';

describe('AddDeliveryFee', () => {
  let component: AddDeliveryFee;
  let fixture: ComponentFixture<AddDeliveryFee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDeliveryFee],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AddDeliveryFee);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
