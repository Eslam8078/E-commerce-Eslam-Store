import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Faqs } from './faqs';

describe('Faqs', () => {
  let component: Faqs;
  let fixture: ComponentFixture<Faqs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Faqs],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Faqs);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
