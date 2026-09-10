import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { UpdateDeliveryFee } from './update-delivery-fee';

describe('UpdateDeliveryFee', () => {
  let component: UpdateDeliveryFee;
  let fixture: ComponentFixture<UpdateDeliveryFee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateDeliveryFee],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'Cairo' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateDeliveryFee);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
