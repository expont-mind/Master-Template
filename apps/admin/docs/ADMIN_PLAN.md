# Monpang Admin Web – Phase Based Development Plan

> **Project**: Monpang Admin Web System  
> **Scale Target**: 50,000 products | 20,000 users | 200-400 orders/day  
> **Tech Stack**: Next.js + TypeScript + Tailwind/shadcn | Supabase (PostgreSQL, Auth, Storage, Edge Functions) | Redis (Upstash) | FCM

---

## Project Overview

### Admin System Modules (29 Total)

1. Admin Login / Role-based access
2. Dashboard (KPIs, revenue, orders, users)
3. Product Management
4. Category Management
5. Brand Management
6. Product Attributes & Variants
7. Inventory & Stock Control
8. Pricing & Discount Management
9. Order Management
10. Order Detail & Status Flow
11. Payment Monitoring
12. Refund & Cancellation
13. User Management
14. User Detail & History
15. Wishlist Monitoring
16. Ratings & Reviews Moderation
17. Notifications Management
18. Campaigns & Promotions
19. Articles / Content Management
20. Events Management
21. Branches / Stores Management
22. FAQs Management
23. Customer Service (Live Chat)
24. Reports & Analytics
25. Search, Filter & Ranking Control
26. System Settings
27. Audit Logs
28. Admin Activity Logs
29. CMS & Static Pages (About, Contacts)

---

## Phase 0 – Architecture & Database Design

| Attribute        | Details                                                          |
| ---------------- | ---------------------------------------------------------------- |
| **Duration**     | 1.5–2 weeks                                                      |
| **Purpose**      | Establish scalable foundation, database schema, caching strategy |
| **Dependencies** | None (foundational)                                              |

### Admin Role System

```sql
CREATE TYPE admin_role AS ENUM (
    'super_admin',    -- Full system access
    'operator',       -- Orders, inventory, products
    'content_manager', -- CMS, campaigns, notifications
    'support'         -- Customer service, limited user access
);
```

### Redis Cache Strategy (Upstash)

| Cache Key Pattern                | TTL    | Purpose             |
| -------------------------------- | ------ | ------------------- |
| `dashboard:stats:{date}`         | 5 min  | Real-time KPIs      |
| `products:list:{page}:{filters}` | 10 min | Product listings    |
| `categories:tree`                | 30 min | Category hierarchy  |
| `inventory:{product_id}`         | 1 min  | Stock levels        |
| `orders:pending:count`           | 30 sec | Order queue count   |
| `user:session:{admin_id}`        | 24 hrs | Admin session cache |

### Database Tables

**Admin Authentication:**

- `admin_users` - Admin accounts with roles
- `admin_sessions` - Session management
- `admin_activity_logs` - Action tracking
- `audit_logs` - Immutable audit trail
- `system_settings` - App configuration

**Product Extensions:**

- `product_attributes` - Custom attributes
- `product_variants` - Size/color variants
- `product_images` - Image gallery
- `price_history` - Price audit trail

**Order Extensions:**

- `order_status_history` - Status tracking
- `payment_transactions` - Gateway logs
- `refunds` - Refund management
- `shipping_addresses` - Delivery info

**Support & Content:**

- `support_tickets` - Customer requests
- `support_messages` - Chat messages
- `campaigns` - Promotions
- `branches` - Store locations
- `faqs` - FAQ entries
- `pages` - CMS pages
- `notification_templates` - Push templates
- `notification_logs` - Delivery tracking

**Analytics:**

- `search_rankings` - Product boosting
- `report_exports` - Export tracking
- `dashboard_cache` - Query cache

---

## Phase 1 – Core Admin & Authentication

| Attribute        | Details                                                  |
| ---------------- | -------------------------------------------------------- |
| **Duration**     | 2 weeks                                                  |
| **Purpose**      | Secure admin login system with role-based access control |
| **Dependencies** | Phase 0                                                  |

### Modules

- Admin Login / Role-based access
- Dashboard (basic layout)
- System Settings (partial)

### APIs / Edge Functions

| Endpoint        | Method   | Purpose               |
| --------------- | -------- | --------------------- |
| `/auth/login`   | POST     | Admin authentication  |
| `/auth/logout`  | POST     | Session termination   |
| `/auth/refresh` | POST     | Token refresh         |
| `/auth/me`      | GET      | Current admin profile |
| `/admin/users`  | GET/POST | Admin user management |
| `/settings`     | GET/PUT  | System settings       |

### Security

- Password: Minimum 12 characters
- Sessions: HttpOnly cookies, 8hr timeout
- Rate Limiting: 5 failed attempts = 15 min lockout

---

## Phase 2 – Product & Catalog Management

| Attribute        | Details                             |
| ---------------- | ----------------------------------- |
| **Duration**     | 3 weeks                             |
| **Purpose**      | Complete product catalog management |
| **Dependencies** | Phase 1                             |

### Modules

- Product Management
- Category Management
- Brand Management
- Product Attributes & Variants
- Inventory & Stock Control
- Pricing & Discount Management

### APIs

| Endpoint                  | Method         | Purpose             |
| ------------------------- | -------------- | ------------------- |
| `/products`               | GET/POST       | Product CRUD        |
| `/products/{id}`          | GET/PUT/DELETE | Single product      |
| `/products/bulk`          | POST           | Bulk operations     |
| `/categories`             | CRUD           | Category management |
| `/categories/tree`        | GET            | Nested tree         |
| `/brands`                 | CRUD           | Brand management    |
| `/inventory/{product_id}` | GET/PUT        | Stock management    |

---

## Phase 3 – Orders & Payments

| Attribute        | Details                                         |
| ---------------- | ----------------------------------------------- |
| **Duration**     | 2.5 weeks                                       |
| **Purpose**      | Real-time order processing and payment tracking |
| **Dependencies** | Phase 2                                         |

### Modules

- Order Management
- Order Detail & Status Flow
- Payment Monitoring
- Refund & Cancellation

### Order Status Flow

```
pending → confirmed → shipped → delivered
    ↓         ↓
 canceled  refund_requested → refunded
```

### Payment Gateways

- QPay
- StorePay
- Pocket
- BONUM

---

## Phase 4 – Users & Customer Support

| Attribute        | Details                                    |
| ---------------- | ------------------------------------------ |
| **Duration**     | 2.5 weeks                                  |
| **Purpose**      | User management and customer service tools |
| **Dependencies** | Phase 3                                    |

### Modules

- User Management
- User Detail & History
- Wishlist Monitoring
- Ratings & Reviews Moderation
- Customer Service (Live Chat)

---

## Phase 5 – Content, Campaigns & Notifications

| Attribute        | Details                                |
| ---------------- | -------------------------------------- |
| **Duration**     | 2.5 weeks                              |
| **Purpose**      | Marketing tools and content management |
| **Dependencies** | Phase 4                                |

### Modules

- Notifications Management
- Campaigns & Promotions
- Articles / Content Management
- Events Management
- Branches / Stores Management
- FAQs Management
- CMS & Static Pages

---

## Phase 6 – Analytics, Reports & Optimization

| Attribute        | Details                             |
| ---------------- | ----------------------------------- |
| **Duration**     | 2 weeks                             |
| **Purpose**      | Business intelligence and reporting |
| **Dependencies** | Phase 5                             |

### Modules

- Dashboard (complete KPIs)
- Reports & Analytics
- Search, Filter & Ranking Control

### Reports

- Revenue reports (daily/weekly/monthly)
- Product performance
- User acquisition
- Inventory turnover
- Export to CSV/Excel

---

## Phase 7 – Security, Scaling & Production Readiness

| Attribute        | Details                                    |
| ---------------- | ------------------------------------------ |
| **Duration**     | 2 weeks                                    |
| **Purpose**      | Hardening, audit, load testing, deployment |
| **Dependencies** | All previous phases                        |

### Modules

- System Settings (complete)
- Audit Logs
- Admin Activity Logs

### Load Testing Targets

| Metric                   | Target  |
| ------------------------ | ------- |
| Concurrent admin users   | 50      |
| Product listing response | < 200ms |
| Order processing         | < 500ms |
| Dashboard load           | < 1s    |
| Search response          | < 300ms |

### Production Checklist

- [ ] Supabase Pro plan
- [ ] Upstash Redis Pro
- [ ] CDN configured
- [ ] SSL certificates
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] CI/CD pipeline
- [ ] Database backup strategy

---

## Timeline Summary

| Phase                     | Duration  | Cumulative     |
| ------------------------- | --------- | -------------- |
| Phase 0 – Architecture    | 2 weeks   | 2 weeks        |
| Phase 1 – Auth            | 2 weeks   | 4 weeks        |
| Phase 2 – Products        | 3 weeks   | 7 weeks        |
| Phase 3 – Orders          | 2.5 weeks | 9.5 weeks      |
| Phase 4 – Users & Support | 2.5 weeks | 12 weeks       |
| Phase 5 – Content         | 2.5 weeks | 14.5 weeks     |
| Phase 6 – Analytics       | 2 weeks   | 16.5 weeks     |
| Phase 7 – Production      | 2 weeks   | **18.5 weeks** |

**Total Estimated Duration: ~4.5 months**

---

## Project Structure

```
monpang/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   └── api/
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── layout/       # Sidebar, Navbar
│   │   ├── forms/        # Form components
│   │   ├── tables/       # Data tables
│   │   └── charts/       # Dashboard charts
│   ├── lib/
│   │   ├── supabase/     # Supabase client
│   │   ├── redis/        # Upstash client
│   │   ├── validations/  # Zod schemas
│   │   └── utils/
│   ├── hooks/
│   ├── types/
│   └── constants/
├── supabase/
│   ├── migrations/
│   └── functions/        # Edge Functions
├── docs/
│   ├── ADMIN_PLAN.md
│   └── ADMIN_TASK.md
└── public/
```
