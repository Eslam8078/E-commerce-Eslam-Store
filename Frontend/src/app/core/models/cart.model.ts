
export interface CartItem {
  productId:
    | string
    | {
        _id: string;
        name: string;
        slug: string;
        price: number;
        images: string[];
        stockQuantity: number;
        isActive?: boolean;
        isDeleted?: boolean;
      };

  priceAtOrder: number;

  isPriceChanged: boolean;

  currentPrice?: number;

  quantity: number;
}

export interface Cart {
  _id: string;

  userId: string;

  items: CartItem[];

  totalPrice: number;
}

export interface GuestCartItem {
  productId: string;

  name: string;

  slug: string;

  price: number;

  image?: string;

  stockQuantity: number;

  quantity: number;
}

export interface GuestCart {
  items: GuestCartItem[];

  totalPrice: number;
}