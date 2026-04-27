# Academic E-Commerce Project

Minimal e-commerce project built with:

- Frontend: React + Vite
- Backend: Django + Django REST Framework
- Admin: Django Admin
- Database: SQLite
- Payment: mock only

## Implemented Scope

- Product browsing
- Category browsing
- Product search, filtering, sorting, and pagination
- Product details
- User registration with email confirmation
- JWT login and logout
- Password reset
- User profile update
- Address management
- Authenticated cart
- Stock validation
- Checkout with mock payment
- Order history
- Wishlist
- Product reviews and ratings
- Coupons and discount application at checkout
- Email notifications for account confirmation, password reset, and order confirmation
- Contact form
- Django Admin management for products, categories, orders, users, contact messages, coupons, reviews, and wishlist
- Admin reports with low stock alerts

## Excluded Features

The project intentionally excludes:

- Next.js
- Custom admin dashboard
- PostgreSQL
- Stripe or real payment
- Advanced analytics dashboard

## Backend Setup

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe backend\manage.py migrate
.\.venv\Scripts\python.exe backend\manage.py createsuperuser
.\.venv\Scripts\python.exe backend\manage.py runserver
```

Backend URL:

```text
http://127.0.0.1:8000
```

Django Admin:

```text
http://127.0.0.1:8000/admin/
```

Store reports inside Django Admin:

```text
http://127.0.0.1:8000/admin/store/reports/
```

## Frontend Setup

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173/
```

Sample coupon codes:

```text
WELCOME10
SAVE25
```

## Main API Endpoints

Products:

```text
GET /api/categories/
GET /api/products/
GET /api/products/<id>/
```

Authentication:

```text
POST /api/auth/register/
POST /api/auth/login/
```

Account:

```text
GET /api/profile/
PATCH /api/profile/
GET /api/addresses/
POST /api/addresses/
PATCH /api/addresses/<id>/
DELETE /api/addresses/<id>/
```

Cart:

```text
GET /api/cart/
POST /api/cart/items/
PATCH /api/cart/items/<id>/
DELETE /api/cart/items/<id>/
```

Orders:

```text
POST /api/orders/checkout/
GET /api/orders/
GET /api/orders/<id>/
```

Contact:

```text
POST /api/contact/
```

## Manual Test Checklist

1. Create categories and products from Django Admin.
2. Open the React app and browse products.
3. Register a new user and confirm the account from the local email link.
4. Login.
5. Update profile.
6. Add an address.
7. Add one or more products to wishlist.
8. Open a product details page and submit a review.
9. Add a product to cart.
10. Update cart quantity.
11. Apply `WELCOME10` or `SAVE25` during checkout.
12. Checkout with mock payment.
13. Confirm stock is reduced in Django Admin.
14. Confirm order appears in account order history.
15. Confirm the order confirmation email appears locally.
16. Request a password reset and open the reset link from the local email output.
17. Submit a contact message.
18. Confirm contact message appears in Django Admin.

## Local Email Notes

For presentation and local testing, email-related features can run without deployment:

- Account confirmation email
- Password reset email
- Order confirmation email

If you keep the default console email backend, Django prints the email content and links in the backend terminal.

## Useful Commands

Backend check:

```powershell
.\.venv\Scripts\python.exe backend\manage.py check
.\.venv\Scripts\python.exe backend\manage.py makemigrations --check --dry-run
```

Frontend build:

```powershell
cd frontend
npm run build
```
