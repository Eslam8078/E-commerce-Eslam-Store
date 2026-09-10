import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListCategories } from './list-categories';

describe('ListCategories', () => {
  let component: ListCategories;
  let fixture: ComponentFixture<ListCategories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListCategories],
    }).compileComponents();

    fixture = TestBed.createComponent(ListCategories);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
