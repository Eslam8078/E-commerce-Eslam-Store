export type NotificationType =
  | 'birthday'
  | 'new_order'
  | 'new_testimonial'
  | 'testimonial_approved'
  | 'testimonial_declined'
  | 'refund_requested'
  | 'refund_approved'
  | 'refund_rejected'
  | 'order_status_changed';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedId?: string | null;
  relatedType?: 'order' | 'testimonial' | 'user' | null;
  birthdayYear?: number | null;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}