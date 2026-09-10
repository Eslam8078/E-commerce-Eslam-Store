export type OrderStatus =
  | "pending"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "rejected"
  | "refund";

export type PaymentMethod = "cash";

export interface OrderItem {
  productId:
    | string
    | {
        _id: string;
        name: string;
        slug: string;
        images: string[];
      };

  priceAtOrder: number;
  quantity: number;
}

export interface StatusHistory {
  status: OrderStatus;
  changedAt: string;
  changedBy?: string;
}

export interface Order {
  _id: string;
  orderNumber?: string;

  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        mobilePhone?: string;
      };

  items: OrderItem[];

  orderedAt: string;
  addressString: string;

  subtotal: number;
  deliveryFee: number;
  totalPrice: number;

  paymentMethod: PaymentMethod;

  orderStatus: OrderStatus;
  refundStatus?: "none" | "pending" | "approved" | "rejected";

  statusHistory: StatusHistory[];

  createdAt?: string;
  updatedAt?: string;
}
