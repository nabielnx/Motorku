# Toko Sparepart

Restaurant Management System (POS) built with **Laravel 12**, **React**, and **Inertia.js**.

---

## Overview

Toko Sparepart is a modern Restaurant Management System designed to simplify restaurant operations for small to medium-sized restaurants.

Main Modules:

- Authentication (multi-role)
- Owner Dashboard
- Cashier POS
- QR Table Self-Ordering
- Product & Category Management
- Kitchen Display System
- Inventory Management
- Payment (Cash, Debit, Credit, QRIS)
- Reports
- Restaurant Settings

---

## Tech Stack

### Backend

- Laravel 12
- PHP 8.3+
- Eloquent ORM

### Frontend

- React
- Inertia.js
- Vite
- Tailwind CSS

### Database

- PostgreSQL 16+

---

## Installed Packages

### Backend

| Package | Purpose |
|----------|---------|
| laravel/breeze | Authentication + React + Inertia |
| spatie/laravel-permission | Role & Permission |
| intervention/image | Image Processing |
| barryvdh/laravel-debugbar | Debugging |
| barryvdh/laravel-ide-helper | IDE Auto Completion |
| ramsey/uuid | UUID Generator |

### Frontend

| Package | Purpose |
|----------|---------|
| react-icons | Icons |
| sonner | Toast Notification |
| zustand | Global State |
| clsx | Conditional Class Helper |
| axios | HTTP Client |
| qrcode.react | QR Code Generation |

---

## Project Structure

```
mie-amour
│
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
├── resources/
├── routes/
├── storage/
├── tests/
└── vendor/
```

---

## Backend Structure

```
app/
│
├── Console/
├── Enums/
├── Events/
├── Exceptions/
├── Helpers/
│
├── Http/
│   ├── Controllers/
│   │   ├── Auth/              (8 Breeze controllers)
│   │   ├── Category/          CategoryController
│   │   ├── Customer/          CustomerMenuController, DokuPaymentController
│   │   ├── Dashboard/         DashboardController
│   │   ├── Inventory/         InventoryController
│   │   ├── Kitchen/           KitchenController
│   │   ├── Order/             OrderController
│   │   ├── Payment/           PaymentController
│   │   ├── Pos/               PosController
│   │   ├── Product/           ProductController
│   │   ├── Profile/           ProfileController
│   │   ├── Report/            ReportController
│   │   ├── Setting/           SettingController
│   │   ├── Table/             TableController
│   │   └── User/              UserController
│   │
│   ├── Middleware/
│   │   ├── ActiveUserMiddleware
│   │   ├── EnsureRestaurantConfiguredMiddleware
│   │   ├── HandleInertiaRequests
│   │   └── KitchenEnabledMiddleware
│   │
│   └── Requests/
│       ├── Auth/              LoginRequest
│       ├── ProfileUpdateRequest
│       ├── StoreCategoryRequest / UpdateCategoryRequest
│       ├── StoreCustomerOrderRequest
│       ├── StoreInventoryRequest / UpdateInventoryRequest
│       ├── StoreOrderRequest / UpdateOrderRequest
│       ├── StorePaymentRequest
│       ├── StoreProductRequest / UpdateProductRequest
│       ├── StoreTableRequest / UpdateTableRequest
│       ├── StoreUserRequest / UpdateUserRequest
│       └── UpdateSettingRequest
│
├── Jobs/
├── Listeners/
├── Models/
│   ├── User.php
│   ├── Role.php
│   ├── Category.php
│   ├── Product.php
│   ├── RestaurantTable.php
│   ├── TableSession.php
│   ├── Order.php
│   ├── OrderItem.php
│   ├── Payment.php
│   ├── InventoryLog.php
│   └── Setting.php
│
├── Notifications/
├── Observers/
├── Policies/
│   ├── CategoryPolicy
│   ├── OrderPolicy
│   ├── PaymentPolicy
│   ├── ProductPolicy
│   ├── RestaurantTablePolicy
│   ├── TablePolicy
│   └── UserPolicy
│
├── Providers/
│
├── Services/
│   ├── AuthService.php
│   ├── CategoryService.php
│   ├── DashboardService.php
│   ├── DokuQrisService.php
│   ├── InventoryService.php
│   ├── KitchenService.php
│   ├── OrderService.php
│   ├── PaymentService.php
│   ├── ProductService.php
│   ├── ReportService.php
│   ├── SettingService.php
│   ├── TableService.php
│   └── UserService.php
│
├── Traits/
└── View/
```

---

## Frontend Structure

```
resources/
└── js/
    │
    ├── Layouts/
    │   ├── AuthenticatedLayout.jsx
    │   └── GuestLayout.jsx
    │
    └── Pages/
        ├── Auth/            (8 Breeze pages)
        ├── Category/        Index
        ├── Customer/        Menu, Payment, OrderStatus, QrisPayment, WaitingConfirmation
        ├── Dashboard.jsx
        ├── Inventory/       Index
        ├── Kitchen/         Display
        ├── Order/           Index, Show
        ├── POS/             Index
        ├── Product/         Index, Create
        ├── Profile/         Edit
        ├── Report/          Index
        ├── Setting/         Index
        ├── Table/           Index
        └── User/            Index
```

---

## Database Structure

```
database/
│
├── factories/
├── migrations/
├── schema/
└── seeders/
    ├── DatabaseSeeder.php
    ├── RoleSeeder.php
    ├── RolePermissionSeeder.php
    ├── UserSeeder.php
    ├── CategorySeeder.php
    ├── ProductSeeder.php
    ├── RestaurantTableSeeder.php
    ├── SettingSeeder.php
    ├── InventorySeeder.php
    ├── DemoOrderSeeder.php
    └── DemoMenuSeeder.php
```

---

## Routes

```
routes/
│
├── web.php
├── api.php
├── auth.php
├── dashboard.php
├── product.php
├── category.php
├── table.php
├── order.php
├── payment.php
├── report.php
├── setting.php
└── console.php
```

---

## Installation

Clone Repository

```bash
git clone https://github.com/Kanzen7/Mie-Amour.git
```

Install Dependencies

```bash
composer install
npm install
```

Copy Environment

```bash
cp .env.example .env
```

Generate Key

```bash
php artisan key:generate
```

Create Database & Run Migration

```bash
php artisan migrate --seed
```

Start Development

```bash
php artisan serve
npm run dev
```

---

## Environment

Required Software

- PHP 8.3+
- Composer
- Node.js 22+
- PostgreSQL 16+

---

## User Roles

- **owner** — Full system access
- **manager** — Operational management
- **cashier** — POS & order management
- **kitchen** — Kitchen display & status updates

---

## Git Workflow

```
main
│
develop
│
feature/*
```

### Branch Naming

| Branch | Purpose | Example |
|----------|---------|----------|
| `feature/` | New Feature | `feature/order-management` |
| `bugfix/` | Bug Fix | `bugfix/login-validation` |
| `hotfix/` | Critical Fix | `hotfix/payment-crash` |
| `release/` | Release Preparation | `release/v1.0.0` |
| `refactor/` | Refactoring | `refactor/order-service` |
| `chore/` | Dependency & Tooling | `chore/install-spatie-permission` |
| `docs/` | Documentation | `docs/update-readme` |
| `test/` | Unit & Feature Test | `test/order-feature` |
| `spike/` | Research / Experiment | `spike/offline-sync` |

---

## Commit Convention

| Type | Description |
|------|-------------|
| `feat:` | New Feature |
| `fix:` | Bug Fix |
| `refactor:` | Refactoring |
| `style:` | Formatting |
| `test:` | Testing |
| `docs:` | Documentation |
| `perf:` | Performance Improvement |
| `ci:` | CI/CD |
| `chore:` | Maintenance & Dependency |

Examples:
```
feat: add cashier dashboard
fix: login validation
refactor: move order logic to service
```

---

## Development Workflow

```
Issue
    │
    ▼
Create Feature Branch
    │
    ▼
Development
    │
    ▼
Pull Request
    │
    ▼
Code Review
    │
    ▼
Merge to develop
    │
    ▼
Testing
    │
    ▼
Merge to main
```

---

## Coding Guidelines

### Controller

Responsible for:

- Receive Request
- Authorization
- Return Response

Keep controllers thin. Business logic belongs in **Services**.

### Service

Responsible for:

- Business Logic
- Database Transaction
- Process Flow
- Complex Validation

### Model

Responsible for:

- Relationship
- Scope
- Attribute
- Query Builder

Avoid placing business logic inside models.

### Form Request

Responsible for validating incoming requests.

---

## Folder Responsibility

| Folder | Responsibility |
|----------|----------------|
| Controllers | Handle Request & Response |
| Requests | Request Validation |
| Services | Business Logic |
| Models | Database Models |
| Pages | Application Pages |
| Layouts | Shared Layout |
| Components | Reusable UI Components |

---

## Current Setup Status

- [x] Laravel Installed
- [x] React Installed
- [x] Inertia Installed
- [x] Tailwind Installed
- [x] Laravel Breeze
- [x] Authentication (multi-role)
- [x] Spatie Permission
- [x] React Icons
- [x] Sonner
- [x] Zustand
- [x] clsx
- [x] Debugbar
- [x] IDE Helper
- [x] UUID
- [x] QR Code Generation

---

## Implemented Features

### Core

- [x] Authentication (Owner, Manager, Cashier, Kitchen)
- [x] Owner Dashboard with revenue stats
- [x] Role-based access control (Spatie Permission)
- [x] PostgreSQL database with UUID primary keys

### POS & Orders

- [x] Cashier POS interface
- [x] Order creation with multiple items
- [x] Order status flow (pending -> preparing -> ready -> completed)
- [x] Order cancellation with stock restoration
- [x] Order history with search & status filter
- [x] Pagination on orders list

### Customer QR Self-Order

- [x] QR code per table
- [x] Customer menu view with categories
- [x] Cart management (localStorage)
- [x] Order placement from table
- [x] Payment confirmation
- [x] Order status tracking

### Payment

- [x] Cash payment with change calculation
- [x] Debit / Credit card
- [x] QRIS payment
- [x] Payment ledger entries
- [x] Revenue tracking (by payment time)

### Kitchen Display

- [x] Real-time order display
- [x] Status updates (accept, complete)
- [x] Polling every 5 seconds

### Products & Inventory

- [x] Product CRUD with images
- [x] Category management
- [x] Stock management
- [x] Stock adjustments (in/out)
- [x] Low stock & critical stock alerts
- [x] Pagination & search

### Tables

- [x] Table CRUD
- [x] QR code generation & printing
- [x] Table status (available, occupied, reserved, cleaning)
- [x] QR token per table

### Reports

- [x] Daily revenue
- [x] Category breakdown
- [x] Period filtering

### Settings

- [x] Restaurant name, address, phone
- [x] Tax & service charge
- [x] Logo upload
- [x] QR timeout configuration
- [x] Printer IP

---

## Notes

- Keep Controllers thin.
- Business logic belongs in Services.
- Use Form Request for validation.
- Reuse Components whenever possible.
- Follow Git Workflow and Commit Convention.
- Always create a Pull Request before merging into `develop`.
