export interface IRevenueReport {
  totalRevenue: number;
  totalOrders: number;
}

export interface ITopProduct {
  productId: string;
  name: string;
  slug: string;
  images: string[];
  totalQuantity: number;
  totalSales: number;
}

export interface ITopSaleProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stockQuantity: number;
  totalQuantity: number;
}

export interface IOrdersByStatus {
  status: string;
  count: number;
  totalValue: number;
}

export interface ISalesByDate {
  date: string;
  totalRevenue: number;
  totalOrders: number;
}

export interface ISalesByGovernorate {
  governorate: string;
  totalRevenue: number;
  totalOrders: number;
}