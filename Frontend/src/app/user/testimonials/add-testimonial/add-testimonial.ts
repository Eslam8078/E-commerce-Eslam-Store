import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TestimonialService } from '../../../core/services/testimonial.service';

@Component({
  selector: 'app-add-testimonial',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-testimonial.html',
  styleUrl: './add-testimonial.css',
})
export class AddTestimonial {
  testimonialForm: FormGroup;

  selectedRating = 0;

  isLoading = false;

  errorMessage = '';

  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private testimonialService: TestimonialService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.testimonialForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    });
  }

  get message() {
    return this.testimonialForm.get('message');
  }

  get rating() {
    return this.testimonialForm.get('rating');
  }

  setRating(value: number): void {
    this.selectedRating = value;
    this.testimonialForm.patchValue({ rating: value });

    this.cdr.detectChanges();
  }

  stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.testimonialForm.invalid) {
      this.testimonialForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.testimonialService.createTestimonial(this.testimonialForm.getRawValue()).subscribe({
      next: (response) => {
        this.isLoading = false;

        this.successMessage = response.message || 'Thank you for your feedback!';

        this.testimonialForm.reset({
          rating: 0,
          message: '',
        });

        this.selectedRating = 0;

        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/user/testimonials/list']);
        }, 900);
      },

      error: (err) => {
        this.isLoading = false;

        this.errorMessage = err?.error?.message || 'Failed to submit testimonial';

        this.cdr.detectChanges();
      },
    });
  }
}
