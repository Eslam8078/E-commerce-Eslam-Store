export type UserRole = 'customer' | 'admin';

export type Gender = 'male' | 'female';

export interface Address {
  _id?: string;
  label: string;
  address?: string;
  street?: string;
  city?: string;
  governorate?: string;
  isDefault?: boolean;
  isDeleted?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  gender?: Gender;
  mobilePhone?: string;
  nationalId?: string;
  DOB?: string;
  isBlocked: boolean;
  isDeleted: boolean;
  addresses: Address[];
  createdAt?: string;
  updatedAt?: string;
}