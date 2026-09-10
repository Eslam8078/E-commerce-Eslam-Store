import { Routes } from '@angular/router';

import { Admin } from './admin/admin';
import { User } from './user/user';
import { PublicLayout } from './layout/public-layout/public-layout';

import { Login } from './shared/auth/login/login';
import { Register } from './shared/auth/register/register';
import { Forbidden } from './shared/forbidden/forbidden';
import { Notfound } from './shared/notfound/notfound';

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

import { Dashboard } from './admin/dashboard/dashboard';

import { Products } from './admin/products/products';
import { ListProducts } from './admin/products/list-products/list-products';
import { AddProduct } from './admin/products/add-product/add-product';
import { UpdateProduct } from './admin/products/update-product/update-product';

import { Categories } from './admin/categories/categories';
import { ListCategories } from './admin/categories/list-categories/list-categories';
import { AddCategory } from './admin/categories/add-category/add-category';
import { UpdateCategory } from './admin/categories/update-category/update-category';

import { Subcategories } from './admin/subcategories/subcategories';
import { ListSubcategories } from './admin/subcategories/list-subcategories/list-subcategories';
import { AddSubcategory } from './admin/subcategories/add-subcategory/add-subcategory';
import { UpdateSubcategory } from './admin/subcategories/update-subcategory/update-subcategory';

import { Orders } from './admin/orders/orders';
import { Users } from './admin/users/users';
import { Testimonials } from './admin/testimonials/testimonials';
import { Reports } from './admin/reports/reports';
import { Faqs } from './admin/faqs/faqs';
import { Backups } from './admin/backups/backups';
import { DeliveryFees } from './admin/delivery-fees/delivery-fees';
import { ListDeliveryFees } from './admin/delivery-fees/list-delivery-fees/list-delivery-fees';
import { AddDeliveryFee } from './admin/delivery-fees/add-delivery-fee/add-delivery-fee';
import { UpdateDeliveryFee } from './admin/delivery-fees/update-delivery-fee/update-delivery-fee';

import { Products as ProductsUser } from './user/products/products';
import { ListProducts as ListProductsUser } from './user/products/list-products/list-products';
import { ProductDetails as ProductDetailsUser } from './user/products/product-details/product-details';
import { Cart } from './user/cart/cart';
import { Checkout } from './user/checkout/checkout';
import { Orders as OrdersUser } from './user/orders/orders';
import { ListOrders as ListOrdersUser } from './user/orders/list-orders/list-orders';
import { OrderDetails as OrderDetailsUser } from './user/orders/order-details/order-details';
import { Profile } from './user/profile/profile';
import { Addresses } from './user/profile/addresses/addresses';
import { Testimonials as TestimonialsUser } from './user/testimonials/testimonials';
import { ListTestimonials as ListTestimonialsUser } from './user/testimonials/list-testimonials/list-testimonials';
import { AddTestimonial as AddTestimonialUser } from './user/testimonials/add-testimonial/add-testimonial';
import { Notifications } from './user/notifications/notifications';

import { Home as HomePublic } from './public/home/home';
import { Faq } from './public/faq/faq';
import { Products as ProductsPublic } from './public/products/products/products';
import { ListProducts as ListProductsPublic } from './public/products/list-products/list-products';
import { PublicProductDetails } from './public/products/product-details/product-details';
import { GuestCartComponent } from './public/guest-cart/guest-cart';
import { Contact } from './public/contact/contact';
import { Legal } from './public/legal/legal';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        component: Login,
      },
      {
        path: 'register',
        component: Register,
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [authGuard, roleGuard(['admin'])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'products',
        component: Products,
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full',
          },
          {
            path: 'list',
            component: ListProducts,
          },
          {
            path: 'add',
            component: AddProduct,
          },
          {
            path: 'update/:id',
            component: UpdateProduct,
          },
        ],
      },
      {
        path: 'categories',
        component: Categories,
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full',
          },
          {
            path: 'list',
            component: ListCategories,
          },
          {
            path: 'add',
            component: AddCategory,
          },
          {
            path: 'update/:id',
            component: UpdateCategory,
          },
        ],
      },
      {
        path: 'subcategories',
        component: Subcategories,
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full',
          },
          {
            path: 'list',
            component: ListSubcategories,
          },
          {
            path: 'add',
            component: AddSubcategory,
          },
          {
            path: 'update/:id',
            component: UpdateSubcategory,
          },
        ],
      },
      {
        path: 'orders',
        component: Orders,
      },
      {
        path: 'users',
        component: Users,
      },
      {
        path: 'testimonials',
        component: Testimonials,
      },
      {
        path: 'reports',
        component: Reports,
      },
      {
        path: 'faqs',
        component: Faqs,
      },
      {
        path: 'notifications',
        component: Notifications,
      },
      {
        path: 'backups',
        component: Backups,
      },
      {
        path: 'delivery-fees',
        component: DeliveryFees,
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          { path: 'list', component: ListDeliveryFees },
          { path: 'add', component: AddDeliveryFee },
          { path: 'update/:governorate', component: UpdateDeliveryFee },
        ],
      },
    ],
  },
  {
    path: 'user',
    component: User,
    canActivate: [authGuard, roleGuard(['customer'])],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        redirectTo: '/',
        pathMatch: 'full',
      },
      {
        path: 'products',
        component: ProductsUser,
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full',
          },
          {
            path: 'list',
            component: ListProductsUser,
          },
          {
            path: ':slug',
            component: ProductDetailsUser,
          },
        ],
      },
      {
        path: 'cart',
        component: Cart,
      },
      {
        path: 'checkout',
        component: Checkout,
      },
      {
        path: 'orders',
        component: OrdersUser,
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full',
          },
          {
            path: 'list',
            component: ListOrdersUser,
          },
          {
            path: ':id',
            component: OrderDetailsUser,
          },
        ],
      },
      {
        path: 'profile',
        component: Profile,
      },
      {
        path: 'profile/addresses',
        component: Addresses,
      },
      {
        path: 'testimonials',
        component: TestimonialsUser,
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full',
          },
          {
            path: 'list',
            component: ListTestimonialsUser,
          },
          {
            path: 'add',
            component: AddTestimonialUser,
          },
        ],
      },
      {
        path: 'notifications',
        component: Notifications,
      },
      {
        path: 'faq',
        component: Faq,
      },
    ],
  },
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        component: HomePublic,
      },
      {
        path: 'faq',
        component: Faq,
      },
      {
        path: 'contact',
        component: Contact,
      },
      {
        path: 'privacy-policy',
        component: Legal,
        data: { type: 'privacy' },
      },
      {
        path: 'terms',
        component: Legal,
        data: { type: 'terms' },
      },
      {
        path: 'products',
        component: ProductsPublic,
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full',
          },
          {
            path: 'list',
            component: ListProductsPublic,
          },
          {
            path: ':slug',
            component: PublicProductDetails,
          },
        ],
      },
    ],
  },
  {
    path: 'guest-cart',
    component: GuestCartComponent,
  },
  {
    path: 'forbidden',
    component: Forbidden,
  },
  {
    path: '**',
    component: Notfound,
  },
];
