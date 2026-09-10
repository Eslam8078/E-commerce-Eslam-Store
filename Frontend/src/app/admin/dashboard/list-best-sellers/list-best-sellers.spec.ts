import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListBestSellers } from './list-best-sellers';

describe('ListBestSellers', () => {
  let component: ListBestSellers;
  let fixture: ComponentFixture<ListBestSellers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListBestSellers] }).compileComponents();
    fixture = TestBed.createComponent(ListBestSellers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
