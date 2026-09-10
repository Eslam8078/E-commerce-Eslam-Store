import { ICategory } from './category.model';
import { ISubCategory } from './subcategory.model';

export interface IProduct {
  _id: string;

  name: string;
  description: string;

  price: number;
  images: string[];

  categoryId:
    | string
    | ICategory;

  subCategoryId:
    | string
    | ISubCategory;

  season: string;
  slug: string;

  stockQuantity: number;

  isActive: boolean;
  isDeleted: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  relatedProducts?: IProduct[];

  createdAt?: string;
  updatedAt?: string;
}