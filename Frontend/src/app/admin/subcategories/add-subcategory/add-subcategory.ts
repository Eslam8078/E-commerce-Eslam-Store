import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SubCategoryService } from '../../../core/services/subcategory.service';
import { CategoryService } from '../../../core/services/category.service';

import { ICategory } from '../../../core/models/category.model';

@Component({
  selector: 'app-add-subcategory',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-subcategory.html',
  styleUrl: './add-subcategory.css',
})
export class AddSubcategory implements OnInit {
  subcategoryForm: FormGroup;

  categories: ICategory[] = [];

  isLoading = false;

  errorMessage = '';

  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private subcategoryService: SubCategoryService,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.subcategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      categoryId: ['', [Validators.required]],
    });
  }

  get name() {
    return this.subcategoryForm.get('name');
  }

  get categoryId() {
    return this.subcategoryForm.get('categoryId');
  }

  ngOnInit(): void {
    this.categoryService.getCategories({ limit: 100 }).subscribe({
      next: (response) => {
        (this.categories = response.data || []);
        this.cdr.detectChanges();
      },
      error: () => {
        (this.categories = []);
        this.cdr.detectChanges();
      },
    });
  }

  addSubcategory(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.subcategoryForm.invalid) {
      this.subcategoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const formValue = this.subcategoryForm.getRawValue();
    const slug = this.slugify(formValue.name);

    this.subcategoryService.createSubCategory({ ...formValue, slug }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Subcategory created successfully';
        this.subcategoryForm.reset();

        setTimeout(() => {
          this.router.navigate(['/admin/subcategories/list']);
        }, 700);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to create subcategory';
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/subcategories/list']);
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