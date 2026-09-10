import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Legal } from './legal';

describe('Legal', () => {
  let component: Legal;
  let fixture: ComponentFixture<Legal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Legal],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { data: {} } } }],
    }).compileComponents();
    fixture = TestBed.createComponent(Legal);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
