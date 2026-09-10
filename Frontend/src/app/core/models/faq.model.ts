export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}