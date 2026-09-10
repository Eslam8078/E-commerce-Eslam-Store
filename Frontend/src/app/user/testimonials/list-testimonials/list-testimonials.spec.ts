import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListTestimonials } from './list-testimonials';

describe('ListTestimonials', () => {
  let component: ListTestimonials;
  let fixture: ComponentFixture<ListTestimonials>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListTestimonials],
    }).compileComponents();

    fixture = TestBed.createComponent(ListTestimonials);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
