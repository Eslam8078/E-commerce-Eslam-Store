import { ICategory } from './category.model';

export interface ISubCategory {
  _id: string;

  name: string;

  slug: string;

  categoryId:
    | string
    | ICategory;

  isActive: boolean;

  isDeleted: boolean;

  createdAt?: string;

  updatedAt?: string;
}