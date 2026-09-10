import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListSubcategories } from './list-subcategories';

describe('ListSubcategories', () => {
  let component: ListSubcategories;
  let fixture: ComponentFixture<ListSubcategories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSubcategories],
    }).compileComponents();

    fixture = TestBed.createComponent(ListSubcategories);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
