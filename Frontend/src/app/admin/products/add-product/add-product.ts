import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { SubCategoryService } from '../../../core/services/subcategory.service';

import { ICategory } from '../../../core/models/category.model';
import { ISubCategory } from '../../../core/models/subcategory.model';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './add-product.html',
  styleUrl: './add-product.css',
})
export class AddProduct implements OnInit {
  productForm: FormGroup;

  categories: ICategory[] = [];
  subcategories: ISubCategory[] = [];

  selectedImages: File[] = [];
  imagePreviews: string[] = [];

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private subcategoryService: SubCategoryService,
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
    this.loadCategories();
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

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
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

    this.subcategories = [];
    this.subCategoryId?.reset('');

    if (!categoryId) {
      return;
    }

    this.subcategoryService.getSubCategories({ categoryId }).subscribe({
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
      this.errorMessage = 'You can upload a maximum of 10 images';
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

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  addProduct(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    if (this.selectedImages.length === 0) {
      this.errorMessage = 'At least one product image is required';
      return;
    }

    this.isLoading = true;

    const formValue = this.productForm.getRawValue();
    const formData = new FormData();

    formData.append('name', String(formValue.name).trim());
    formData.append('description', String(formValue.description).trim());
    formData.append('price', String(formValue.price));
    formData.append('categoryId', String(formValue.categoryId));
    formData.append('subCategoryId', String(formValue.subCategoryId));

    if (formValue.season) {
      formData.append('season', String(formValue.season));
    }

    formData.append('slug', String(formValue.slug).trim().toLowerCase());
    formData.append('stockQuantity', String(formValue.stockQuantity));
    formData.append('isBestSeller', String(formValue.isBestSeller));
    formData.append('isNewArrival', String(formValue.isNewArrival));

    this.selectedImages.forEach((file) => {
      formData.append('images', file);
    });

    this.productService.createProduct(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Product created successfully';
        this.cdr.detectChanges();
        this.productForm.reset({ isBestSeller: false, isNewArrival: false });
        this.subcategories = [];
        this.selectedImages = [];
        this.imagePreviews = [];

        setTimeout(() => {
          this.router.navigate(['/admin/products/list']);
        }, 700);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to create product';
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/products/list']);
  }
}
