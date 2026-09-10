import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-add-category',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-category.html',
  styleUrl: './add-category.css',
})
export class AddCategory {
  categoryForm: FormGroup;

  isLoading = false;

  errorMessage = '';

  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    });
  }

  get name() {
    return this.categoryForm.get('name');
  }

  addCategory(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const name: string = this.categoryForm.getRawValue().name;
    const slug = this.slugify(name);

    this.categoryService.createCategory({ name, slug }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Category created successfully';
        this.cdr.detectChanges();
        this.categoryForm.reset();

        setTimeout(() => {
          this.router.navigate(['/admin/categories/list']);
        }, 700);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to create category';
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/categories/list']);
  }

  private slugify(value: string): string {
    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}