import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddTestimonial } from './add-testimonial';

describe('AddTestimonial', () => {
  let component: AddTestimonial;
  let fixture: ComponentFixture<AddTestimonial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTestimonial],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTestimonial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
