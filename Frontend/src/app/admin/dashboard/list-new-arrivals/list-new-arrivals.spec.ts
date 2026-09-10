import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListNewArrivals } from './list-new-arrivals';

describe('ListNewArrivals', () => {
  let component: ListNewArrivals;
  let fixture: ComponentFixture<ListNewArrivals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListNewArrivals] }).compileComponents();
    fixture = TestBed.createComponent(ListNewArrivals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
