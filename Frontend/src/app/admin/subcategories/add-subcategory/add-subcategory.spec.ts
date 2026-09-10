import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddSubcategory } from './add-subcategory';

describe('AddSubcategory', () => {
  let component: AddSubcategory;
  let fixture: ComponentFixture<AddSubcategory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSubcategory],
    }).compileComponents();

    fixture = TestBed.createComponent(AddSubcategory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
