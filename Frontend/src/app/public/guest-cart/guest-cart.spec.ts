import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuestCartComponent } from './guest-cart';

describe('GuestCartComponent', () => {
  let component: GuestCartComponent;
  let fixture: ComponentFixture<GuestCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestCartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuestCartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
