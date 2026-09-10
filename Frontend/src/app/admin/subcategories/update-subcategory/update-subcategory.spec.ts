import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateSubcategory } from './update-subcategory';

describe('UpdateSubcategory', () => {
  let component: UpdateSubcategory;
  let fixture: ComponentFixture<UpdateSubcategory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateSubcategory],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateSubcategory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
