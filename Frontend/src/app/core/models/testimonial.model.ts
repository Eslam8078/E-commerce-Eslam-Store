export type TestimonialStatus =
  | 'pending'
  | 'approved'
  | 'declined';

export interface Testimonial {
  _id: string;

  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        mobilePhone?: string;
      };

  message: string;
  rating: number;

  status: TestimonialStatus;
  isDeleted: boolean;

  createdAt?: string;
  updatedAt?: string;
}