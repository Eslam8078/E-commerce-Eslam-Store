import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { SubCategoryService } from '../../../core/services/subcategory.service';

import { IProduct } from '../../../core/models/product.model';
import { ICategory } from '../../../core/models/category.model';
import { ISubCategory } from '../../../core/models/subcategory.model';
import { environment } from '../../../../environment/env';

@Component({
  selector: 'app-update-product',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './update-product.html',
  styleUrl: './update-product.css',
})
export class UpdateProduct implements OnInit {
  productForm: FormGroup;

  product: IProduct | null = null;
  productId = '';

  categories: ICategory[] = [];
  subcategories: ISubCategory[] = [];

  existingImages: string[] = [];

  readonly staticURL = environment.staticURL;

  selectedImages: File[] = [];
  imagePreviews: string[] = [];

  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private subcategoryService: SubCategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      price: [null, [Validators.required, Validators.min(0)]],
      categoryId: ['', [Validators.required]],
      subCategoryId: ['', [Validators.required]],
      season: [''],
      slug: ['', [Validators.required, Validators.minLength(2)]],
      stockQuantity: [null, [Validators.required, Validators.min(0)]],
      isBestSeller: [false],
      isNewArrival: [false],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Product ID is missing';
      return;
    }

    this.productId = id;
    this.loadCategories();
    this.loadProduct();
  }

  get name() {
    return this.productForm.get('name');
  }

  get description() {
    return this.productForm.get('description');
  }

  get price() {
    return this.productForm.get('price');
  }

  get categoryId() {
    return this.productForm.get('categoryId');
  }

  get subCategoryId() {
    return this.productForm.get('subCategoryId');
  }

  get season() {
    return this.productForm.get('season');
  }

  get slug() {
    return this.productForm.get('slug');
  }

  get stockQuantity() {
    return this.productForm.get('stockQuantity');
  }

  loadProduct(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getAdminProductById(this.productId).subscribe({
      next: (response) => {
        this.product = response.data;
        this.fillForm(response.data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load product';
        this.cdr.detectChanges();
      },
    });
  }

  fillForm(product: IProduct): void {
    const categoryId = this.getCategoryId(product.categoryId);
    const subCategoryId = this.getSubCategoryId(product.subCategoryId);

    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId,
      subCategoryId,
      season: product.season || '',
      slug: product.slug,
      stockQuantity: product.stockQuantity,
      isBestSeller: product.isBestSeller || false,
      isNewArrival: product.isNewArrival || false,
    });

    this.existingImages = [...product.images];
    this.loadSubcategories(categoryId);
  }

  private getCategoryId(categoryId: string | ICategory): string {
    if (typeof categoryId === 'string') {
      return categoryId;
    }

    return categoryId._id || '';
  }

  private getSubCategoryId(subCategoryId: string | ISubCategory): string {
    if (typeof subCategoryId === 'string') {
      return subCategoryId;
    }

    return subCategoryId._id || '';
  }

  loadCategories(): void {
    this.categoryService.getAdminCategories({ limit: 100, includeDeleted: true }).subscribe({
      next: (response) => {
        this.categories = response.data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to load categories';
        this.cdr.detectChanges();
      },
    });
  }

  onCategoryChange(): void {
    const categoryId = this.categoryId?.value;

    this.subCategoryId?.reset('');
    this.subcategories = [];

    if (!categoryId) {
      return;
    }

    this.loadSubcategories(categoryId);
  }

  loadSubcategories(categoryId: string): void {
    if (!categoryId) {
      this.subcategories = [];
      return;
    }

    this.subcategoryService.getAdminSubCategories({ categoryId, limit: 100, includeDeleted: true }).subscribe({
      next: (response) => {
        this.subcategories = response.data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to load subcategories';
        this.cdr.detectChanges();
      },
    });
  }

  generateSlug(): void {
    const name = this.name?.value;

    if (!name) {
      return;
    }

    const slug = String(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    this.slug?.setValue(slug);
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    if (files.length > 10) {
      this.errorMessage = 'You can select a maximum of 10 new images';
      input.value = '';
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg'];
    const invalidFile = files.find((file) => !allowedTypes.includes(file.type));

    if (invalidFile) {
      this.errorMessage = 'Only PNG and JPEG images are allowed';
      input.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > 2 * 1024 * 1024);

    if (oversizedFile) {
      this.errorMessage = 'Each image must be 2MB or less';
      input.value = '';
      return;
    }

    this.selectedImages = files;
    this.imagePreviews = [];

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.imagePreviews.push(reader.result);
        }
      };

      reader.readAsDataURL(file);
    });

    this.errorMessage = '';
  }

  removeNewImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  updateProduct(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.productForm.getRawValue();
    const formData = new FormData();

    formData.append('name', String(formValue.name).trim());
    formData.append('description', String(formValue.description).trim());
    formData.append('price', String(formValue.price));
    formData.append('categoryId', String(formValue.categoryId));
    formData.append('subCategoryId', String(formValue.subCategoryId));
    formData.append('season', String(formValue.season || ''));
    formData.append('slug', String(formValue.slug).trim().toLowerCase());
    formData.append('stockQuantity', String(formValue.stockQuantity));
    formData.append('isBestSeller', String(formValue.isBestSeller));
    formData.append('isNewArrival', String(formValue.isNewArrival));

    this.selectedImages.forEach((file) => {
      formData.append('images', file);
    });

    this.productService.updateProduct(this.productId, formData).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.successMessage = response.message || 'Product updated successfully';
        this.cdr.detectChanges();
        this.product = response.data;
        this.existingImages = [...response.data.images];
        this.selectedImages = [];
        this.imagePreviews = [];

        setTimeout(() => {
          this.router.navigate(['/admin/products/list']);
        }, 700);
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.message || 'Failed to update product';
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/products/list']);
  }
}
