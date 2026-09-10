import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SubCategoryService } from '../../../core/services/subcategory.service';
import { CategoryService } from '../../../core/services/category.service';

import { ICategory } from '../../../core/models/category.model';

@Component({
  selector: 'app-update-subcategory',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-subcategory.html',
  styleUrl: './update-subcategory.css',
})
export class UpdateSubcategory implements OnInit {
  subcategoryForm: FormGroup;

  categories: ICategory[] = [];

  subcategoryId = '';

  isLoading = false;

  isSaving = false;

  errorMessage = '';

  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private subcategoryService: SubCategoryService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
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
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Subcategory ID is missing';
      return;
    }

    this.subcategoryId = id;

    this.categoryService.getAdminCategories({ limit: 100, includeDeleted: true }).subscribe({
      next: (response) => {
        (this.categories = response.data || []);
        this.cdr.detectChanges();
      },
      error: () => {
        (this.categories = []);
        this.cdr.detectChanges();
      },
    });

    this.load();
  }

  load(): void {
    this.isLoading = true;

    this.subcategoryService.getAdminSubCategoryById(this.subcategoryId).subscribe({
      next: (response) => {
        const sub = response.data;
        const categoryId =
          sub.categoryId && typeof sub.categoryId === 'object' ? (sub.categoryId as any)._id : sub.categoryId;

        this.subcategoryForm.patchValue({ name: sub.name, categoryId });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load subcategory';
        this.cdr.detectChanges();
      },
    });
  }

  updateSubcategory(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.subcategoryForm.invalid) {
      this.subcategoryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.subcategoryForm.getRawValue();
    const slug = this.slugify(formValue.name);

    this.subcategoryService.updateSubCategory(this.subcategoryId, { ...formValue, slug }).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.successMessage = response.message || 'Subcategory updated successfully';

        setTimeout(() => {
          this.router.navigate(['/admin/subcategories/list']);
        }, 700);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.message || 'Failed to update subcategory';
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