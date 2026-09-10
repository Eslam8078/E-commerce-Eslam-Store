import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-update-category',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-category.html',
  styleUrl: './update-category.css',
})
export class UpdateCategory implements OnInit {
  categoryForm: FormGroup;

  categoryId = '';

  isLoading = false;

  isSaving = false;

  errorMessage = '';

  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Category ID is missing';
      return;
    }

    this.categoryId = id;
    this.load();
  }

  load(): void {
    this.isLoading = true;

    this.categoryService.getAdminCategoryById(this.categoryId).subscribe({
      next: (response) => {
        this.categoryForm.patchValue({ name: response.data.name });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load category';
        this.cdr.detectChanges();
      },
    });
  }

  updateCategory(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const name: string = this.categoryForm.getRawValue().name;
    const slug = this.slugify(name);

    this.categoryService.updateCategory(this.categoryId, { name, slug }).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.successMessage = response.message || 'Category updated successfully';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/admin/categories/list']);
        }, 700);
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.message || 'Failed to update category';
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
