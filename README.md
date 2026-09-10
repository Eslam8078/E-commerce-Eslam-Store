# Eslam Store

A full-stack clothing e-commerce application built with **MEAN Stack technologies**:

- **Frontend:** Angular 22, TypeScript, RxJS, Bootstrap 5, Bootstrap Icons
- **Backend:** Node.js, Express 5
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT + bcrypt
- **Uploads:** Multer
- **Logging:** Winston
- **Backup & Restore:** `mongodump` / `mongorestore`

The project contains a public shopping experience, customer account area, and protected admin dashboard.

## Main Features

### Customer

- Register and login with JWT authentication.
- Customer profile management.
- Address management with a default address.
- Guest cart using local storage.
- Customer cart synchronization/merge after login.
- Product browsing, search, categories, subcategories, seasons, and product details.
- Price-change detection inside the cart before checkout.
- Stock validation before order creation.
- Checkout with Cash on Delivery.
- Delivery fee calculation by governorate.
- Order history and order details.
- Order cancellation and refund request flow.
- Refund result notifications.
- Testimonials after a delivered order.
- FAQ, Contact Us, Privacy Policy, and Terms pages.
- Customer notifications with clickable links to the related order/testimonial.
- Logout returns the customer to the public Home page.

### Admin

- Protected admin dashboard.
- Product, category, and subcategory management.
- Product activation/deactivation and soft delete/restore.
- Seasonal bulk activation/deactivation.
- Manual Best Sellers selection.
- User management: view, block/unblock, soft delete/restore, and create another admin.
- Order management and status updates.
- Refund approval/rejection.
- New-order and other business notifications.
- Testimonial moderation.
- FAQ management.
- Sales and order reports.
- Backup list, backup creation, and database restore.
- Admin notifications can be read, opened, and deleted.

## Order Status

Orders use the following main statuses:

- `pending`
- `preparing`
- `shipped`
- `delivered`
- `cancelled`
- `rejected`
- `refund`

Refund processing is tracked separately with a `refundStatus` value such as `none`, `pending`, `approved`, or `rejected`.

When a refund is approved, the related stock is restored and the refunded order value is excluded from dashboard revenue calculations according to the implemented reporting logic.

## Notifications

Notifications are stored in MongoDB and can be marked as read or deleted.

Notifications may contain a related entity so the frontend can navigate directly to the relevant page, for example:

- New order → related order
- Order status changed → related order
- Refund requested/approved/rejected → related order
- New testimonial → related testimonial
- Testimonial approved/declined → related testimonial

## Best Sellers

Best Sellers are selected by the Admin from the product management area. The public Home page displays products marked as Best Sellers by the admin rather than relying only on sales aggregation.

## Project Structure

```text
Eslam Store/
├── back/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utilities/
│   ├── uploads/
│   ├── app.js
│   ├── server.js
│   ├── seed.js
│   ├── package.json
│   └── .env.example
│
├── front/
│   ├── src/app/
│   │   ├── admin/
│   │   ├── core/
│   │   ├── layout/
│   │   ├── public/
│   │   ├── shared/
│   │   └── user/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Backend Architecture

The backend follows a simple layered structure:

```text
Request
  ↓
Route
  ↓
Middleware
  ↓
Controller
  ↓
Mongoose Model / Service / Utility
  ↓
MongoDB
  ↓
JSON Response
```

### Important Backend Areas

- `routes/` defines REST endpoints.
- `controllers/` handles request logic and responses.
- `models/` defines MongoDB schemas and validation.
- `middlewares/` handles authentication, authorization, CORS, uploads, and errors.
- `services/` contains specialized operations such as backups and birthday notifications.
- `utilities/` contains shared helpers for pagination, errors, logging, async handling, and date ranges.

## Frontend Architecture

Angular is organized into public, customer, admin, shared, and core areas.

```text
public/
  Home
  Products
  Product Details
  FAQ
  Contact
  Legal
  Guest Cart

user/
  Products
  Cart
  Checkout
  Orders
  Profile
  Addresses
  Testimonials
  Notifications
  FAQ

admin/
  Dashboard
  Products
  Categories
  Subcategories
  Orders
  Users
  Testimonials
  Reports
  FAQs
  Notifications
  Backups
```

The route guards protect authenticated and admin-only areas.

## API Base URL

The backend is mounted under:

```text
http://localhost:3000/api
```

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Users

```http
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/me/addresses
POST   /api/users/me/addresses
PATCH  /api/users/me/addresses/:addressId
DELETE /api/users/me/addresses/:addressId
```

Admin user management is available under `/api/users` and `/api/users/admins`.

### Products

```http
GET    /api/products
GET    /api/products/:id
GET    /api/products/slug/:slug
GET    /api/products/admin
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
PATCH  /api/products/:id/activate
PATCH  /api/products/:id/deactivate
PATCH  /api/products/:id/restore
PATCH  /api/products/:id/best-seller
PATCH  /api/products/admin/season/:season/activate
PATCH  /api/products/admin/season/:season/deactivate
```

### Cart

```http
GET    /api/cart
POST   /api/cart
POST   /api/cart/merge
PATCH  /api/cart/:productId
PATCH  /api/cart/:productId/confirm-price
DELETE /api/cart/:productId
DELETE /api/cart/clear
```

### Orders

```http
GET    /api/orders/quote
POST   /api/orders
GET    /api/orders/my-orders
GET    /api/orders/my-orders/:id
PATCH  /api/orders/:id/cancel
PATCH  /api/orders/:id/refund
```

Admin order management includes:

```http
GET   /api/orders
GET   /api/orders/:id
PATCH /api/orders/:id/status
PATCH /api/orders/:id/refund/approve
PATCH /api/orders/:id/refund/reject
```

### Testimonials

```http
GET    /api/testimonials/approved
POST   /api/testimonials
GET    /api/testimonials/my-testimonials
DELETE /api/testimonials/my-testimonials/:id
```

Admin moderation is available under `/api/testimonials`.

### Categories / Subcategories

Public and admin CRUD/activation/soft-delete/restore endpoints are available under:

```text
/api/categories
/api/subcategories
```

### FAQs

```text
/api/faqs
/api/faqs/admin
```

### Notifications

```http
GET    /api/notifications
GET    /api/notifications/:id
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

### Reports

Public endpoints:

```http
GET /api/reports/top-sales
GET /api/reports/best-sellers
GET /api/reports/new-arrivals
```

Admin reporting endpoints:

```http
GET /api/reports/revenue
GET /api/reports/top-products
GET /api/reports/orders-by-status
GET /api/reports/sales-by-date
GET /api/reports/sales-by-governorate
```

### Backup / Restore

Admin-only endpoints:

```http
GET  /api/backups
POST /api/backups
POST /api/backups/restore
```

## Authentication & Security

- JWT authentication for logged-in users.
- Role-based authorization for admin/customer access.
- Password hashing with bcrypt.
- Passwords are not returned by default from the User model.
- Blocked and deleted users cannot authenticate normally.
- Sensitive environment values are stored in `.env` rather than source code.
- CORS is configured through environment variables.
- Request body size limits are configured in Express.
- Upload limits are handled with Multer.
- Soft delete is used for recoverable business data.

## MongoDB Transactions

Order creation uses a MongoDB transaction for critical operations such as:

```text
Validate cart
   ↓
Validate prices
   ↓
Validate stock
   ↓
Create order
   ↓
Decrease stock
   ↓
Clear cart
   ↓
Commit
```

If a critical step fails, the transaction can roll back the related database changes.

## Installation

### 1. Requirements

Install:

- Node.js
- npm
- MongoDB
- MongoDB Database Tools (`mongodump` / `mongorestore`) for backup and restore functionality

### 2. Backend Setup

```bash
cd back
npm install
```

Create a `.env` file based on `.env.example`.

Example:

```env
PORT=3000
DB_URI=mongodb://localhost:27017/EZ-Store
SECRET_KEY=your-secret-key
JWT_EXPIRES_IN=1d
ALLOWED_ORIGINS=http://localhost:4200
DB_NAME=EZ-Store
NODE_ENV=dev
```

Start the backend:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

### 3. Seed Database

To seed the database:

```bash
npm run seed
```

To reset and seed again:

```bash
npm run seed:reset
```

### 4. Frontend Setup

```bash
cd front
npm install
npm start
```

The Angular development server normally runs at:

```text
http://localhost:4200
```

## Environment Configuration

The backend `.env.example` currently expects:

```env
PORT=3000
DB_URI=mongodb://localhost:27017/EZ-Store
SECRET_KEY=your-secret-key
JWT_EXPIRES_IN=1d
ALLOWED_ORIGINS=http://localhost:4200,http://mydomain.com,http://dashboard.mydomain.com
DB_NAME=EZ-Store
NODE_ENV=dev
```

Do not commit real secrets or production credentials.

## Useful npm Scripts

### Backend

```bash
npm start
npm run dev
npm run seed
npm run seed:reset
```

### Frontend

```bash
npm start
npm run build
npm run watch
npm test
```

## UI / UX

The frontend uses a responsive design with:

- Responsive layouts for desktop, tablet, and mobile.
- Modern cards, forms, tables, filters, and dashboard panels.
- Hover states and transitions.
- Page entrance animations and micro-interactions.
- Consistent public, customer, and admin styling.
- Professional Header and Footer.
- Customer greeting after login.
- Clickable notifications.

## Data Rules

### Soft Delete

Business records are generally not physically deleted. Instead, they use `isDeleted` and can often be restored by an admin.

### Default Address

Only one active address is treated as the customer's default address.

### Product Visibility

Public product visibility respects product, category, and subcategory status.

### Testimonials

Customers can submit testimonials after having a delivered order, and each customer is limited to the implemented maximum number of active testimonials.

### Orders

The backend recalculates important order values and validates stock instead of trusting frontend values.

## Backup and Restore

Backups are managed by the admin dashboard and use MongoDB Database Tools.

Typical operations are equivalent to:

```bash
mongodump
mongorestore
```

Restore operations should be treated as destructive because restoring a database can replace existing data depending on the selected backup and restore options.

## Project Notes

- Public Home is the main landing page.
- `Eslam Store` in the header routes to the public Home page.
- Customer login redirects to Home.
- Customer logout redirects to Home.
- Admin sections are protected by authentication and role guards.
- Notification records can carry related entity IDs so the UI can open the correct resource.

## License

This project currently uses the backend package's default `ISC` license setting.
