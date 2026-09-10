import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListTopProducts } from './list-top-products';

describe('ListTopProducts', () => {
  let component: ListTopProducts;
  let fixture: ComponentFixture<ListTopProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListTopProducts] }).compileComponents();
    fixture = TestBed.createComponent(ListTopProducts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
