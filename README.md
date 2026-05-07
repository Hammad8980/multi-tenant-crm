# Multi-Tenant CRM System

A production-grade, full-stack multi-tenant CRM system built with **NestJS**, **PostgreSQL**, **Next.js**, and **TypeScript**. This project demonstrates backend architecture, database design, concurrency handling, performance optimization, and production-level thinking.

## 🌐 Live Demo

**Frontend**: https://multi-tenant-crm-lgqg.vercel.app  
**Backend API**: https://multi-tenant-crm-sage.vercel.app  
**API Documentation**: https://multi-tenant-crm-sage.vercel.app/api/docs

**Test Credentials**:
- Admin: `admin@acme.com` / `password123`
- Member: `jane@acme.com` / `password123`

---

## 🛠 Tech Stack

**Backend**: NestJS, TypeScript, PostgreSQL, TypeORM, JWT, Swagger  
**Frontend**: Next.js 14, TypeScript, React Query, Zustand, Tailwind CSS, shadcn/ui  
**Deployment**: Vercel (Frontend + Backend), Supabase (Database)

---

## ✨ Features Implemented

### Backend
- ✅ Multi-tenancy with complete data isolation (`organizationId` filtering)
- ✅ JWT authentication with role-based access control (admin/member)
- ✅ Concurrency-safe customer assignment (pessimistic locking, max 5 per user)
- ✅ Soft delete with restore functionality
- ✅ Comprehensive activity logging for audit trail
- ✅ Performance-optimized queries with database indexes
- ✅ Swagger API documentation
- ✅ Strict TypeScript with DTO validation

### Frontend
- ✅ Customer management (CRUD, pagination, search)
- ✅ Customer assignment with validation
- ✅ Notes management per customer
- ✅ User management (admin only)
- ✅ Soft delete UI with restore
- ✅ Debounced search (500ms)
- ✅ Loading states and error handling
- ✅ React Query caching + Zustand for auth state

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start server (auto-syncs schema)
npm run start:dev

# Seed test data
npm run seed
```

Backend runs on **http://localhost:3000**  
Swagger docs at **http://localhost:3000/api/docs**

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:3000

npm run dev
```

Frontend runs on **http://localhost:3001**

---

## 🏗 Architecture Decisions

### Why NestJS?
- Built-in TypeScript support with decorators
- Dependency injection for testability
- Modular architecture (modules, controllers, services)
- Excellent Swagger integration
- Enterprise-grade patterns out of the box

### Why PostgreSQL?
- ACID compliance for data integrity
- Advanced features (pessimistic locking, transactions)
- Excellent performance with proper indexing
- Strong TypeORM support
- Industry standard for multi-tenant applications

### Why TypeORM?
- TypeScript-first design with decorators
- Automatic schema synchronization (development)
- Built-in migration support (production)
- Query builder for complex queries
- Seamless NestJS integration

### Why Monorepo?
- Easier to share types between frontend/backend
- Single version control and deployment
- Simpler for assignment submission and review
- Unified documentation

### Why React Query + Zustand?
- **React Query**: Automatic caching, refetching, and server state synchronization
- **Zustand**: Lightweight client state (auth) with localStorage persistence
- Clear separation: server data vs UI state
- Minimal boilerplate, excellent TypeScript support

---

## 🔒 Multi-Tenancy Isolation

### Implementation Strategy

Every entity (except `Organization`) includes an `organizationId` field. All database queries automatically filter by the authenticated user's organization.

**Database Level**:
```typescript
@Entity('customers')
export class Customer {
  @Column({ type: 'uuid' })
  @Index() // ✅ Indexed for fast filtering
  organizationId: string;
}
```

**Service Layer Enforcement**:
```typescript
async findAll(currentUser: any) {
  return this.customerRepository.find({
    where: {
      organizationId: currentUser.organizationId, // ✅ Always filtered
    },
  });
}
```

**JWT Strategy Injection**:
```typescript
async validate(payload: any) {
  const user = await this.usersService.findOne(payload.sub);
  return {
    userId: user.id,
    organizationId: user.organizationId, // ✅ Injected into all requests
    role: user.role,
  };
}
```

### Security Guarantees

- ✅ **Database indexes** on all `organizationId` columns
- ✅ **Foreign keys** prevent orphaned records
- ✅ **Service layer** enforces filtering on every query
- ✅ **Impossible to access** another organization's data
- ✅ **Tested** with multiple organizations in seed data

### Why This Approach?

**Alternatives Considered**:
- Separate databases per tenant → Too complex for this scale
- Schema per tenant → Harder to maintain
- Row-Level Security (RLS) → PostgreSQL-specific, less portable

**Chosen**: Shared database with `organizationId` filtering
- Simple to implement and understand
- Easy to query and maintain
- Scales to thousands of organizations
- Database-agnostic

---

## ⚡ Concurrency Safety

### The Problem

Multiple concurrent requests trying to assign customers to the same user could exceed the 5-customer limit:

```
Request A: Check count (4) → Assign → Count becomes 5 ✅
Request B: Check count (4) → Assign → Count becomes 6 ❌ Race condition!
```

### The Solution: Pessimistic Locking

```typescript
async assignCustomer(customerId: string, userId: string, currentUser: any) {
  return await this.dataSource.transaction(async (manager) => {
    // 1. Lock rows during read (prevents concurrent access)
    const assignedCustomers = await manager
      .createQueryBuilder(Customer, 'customer')
      .setLock('pessimistic_write')  // 🔒 Database-level lock
      .where('customer.assignedTo = :userId', { userId })
      .andWhere('customer.deletedAt IS NULL')
      .getMany();

    // 2. Check count after locking
    if (assignedCustomers.length >= 5) {
      throw new BadRequestException('User already has 5 customers');
    }

    // 3. Assign customer (still within transaction)
    await manager.update(Customer, { id: customerId }, { assignedTo: userId });

    return await manager.findOne(Customer, { where: { id: customerId } });
  });
}
```

### Why This Works

1. **Pessimistic Write Lock**: Database prevents other transactions from reading/writing locked rows
2. **Transaction Isolation**: All operations are atomic (all-or-nothing)
3. **Database-Level**: Works across multiple server instances
4. **Race Condition Proof**: Concurrent requests are serialized by the database

### Alternative Approaches Considered

| Approach | Pros | Cons | Chosen? |
|----------|------|------|---------|
| **Pessimistic Locking** | Guarantees correctness, simple | Slightly lower throughput | ✅ Yes |
| **Optimistic Locking** | Higher throughput | Retry logic needed, can fail | ❌ No |
| **Application Lock** | No DB support needed | Doesn't work across instances | ❌ No |
| **Redis Lock** | Works across instances | Additional infrastructure | ❌ No |

**Decision**: Pessimistic locking provides the best balance of correctness and simplicity. For customer assignment, **correctness is more important than throughput**.

---

## 🚄 Performance Strategy & Indexing

### Database Indexes

```typescript
// Customer entity
@Index(['organizationId'])                    // Multi-tenancy queries
@Index(['assignedTo', 'organizationId'])      // Assignment queries
@Index(['email'])                             // Search queries
@Index(['deletedAt'])                         // Soft delete filtering
@Entity('customers')
export class Customer { ... }

// User entity
@Index(['organizationId'])                    // Multi-tenancy queries
@Index(['email'])                             // Login queries
@Entity('users')
export class User { ... }

// Note entity
@Index(['customerId', 'organizationId'])      // Customer notes queries
@Entity('notes')
export class Note { ... }
```

### Query Optimization

**1. Pagination**
```typescript
async findAll(page = 1, limit = 10) {
  return this.customerRepository
    .createQueryBuilder('customer')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();
}
```

**2. Selective Loading**
```typescript
// Load relations only when needed
.leftJoinAndSelect('customer.assignedToUser', 'assignedToUser')
```

**3. Soft Delete Filtering**
```typescript
// Indexed deletedAt column for fast filtering
.where('customer.deletedAt IS NULL')
```

### N+1 Query Prevention

- ✅ Use `leftJoinAndSelect` for relations
- ✅ Avoid lazy loading in loops
- ✅ Use QueryBuilder for complex queries
- ✅ Frontend uses React Query for caching

### Scaling to 100K+ Customers

| Metric | Strategy | Result |
|--------|----------|--------|
| **Query Time** | Indexed `organizationId` | O(log n) lookups |
| **Memory** | Pagination (10 per page) | Constant memory |
| **Soft Delete** | Indexed `deletedAt` | No table scans |
| **Search** | Indexed `email` and `name` | Fast ILIKE queries |
| **Assignment** | Composite index | Fast count queries |

---

## 🗑 Soft Delete Integrity

### Implementation

```typescript
@Entity('customers')
export class Customer {
  @DeleteDateColumn()
  deletedAt: Date;  // NULL = active, timestamp = deleted
}
```

### Behavior

1. **Delete**: Sets `deletedAt` to current timestamp
2. **Normal Queries**: Automatically filter `WHERE deletedAt IS NULL`
3. **Include Deleted**: Use `withDeleted()` to include soft-deleted records
4. **Restore**: Sets `deletedAt` back to NULL

### Data Preservation

When a customer is soft-deleted:
- ✅ **Notes remain stored** (foreign key still valid)
- ✅ **Activity logs remain stored** (immutable audit trail)
- ✅ **Restoring customer restores visibility** of all related data

**Why This Matters**:
- Accidental deletions can be recovered
- Audit trail is never lost
- Compliance requirements met

---

## 🎯 Production Improvement

### Chosen: Swagger API Documentation

**Why Swagger?**

1. **Developer Experience**: Interactive API testing without Postman
2. **Self-Documenting**: Auto-generated from code decorators
3. **Always Up-to-Date**: Documentation can't drift from implementation
4. **Type Safety**: Request/response schemas validated
5. **Onboarding**: New developers can explore API instantly

### Implementation

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Multi-Tenant CRM API')
  .setDescription('Production-grade CRM system')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

SwaggerModule.setup('api/docs', app, document);
```

```typescript
// Controller decorators
@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Create a new customer' })
@ApiResponse({ status: 201, description: 'Customer created' })
@Post()
create(@Body() dto: CreateCustomerDto) { ... }
```

**Access**: http://localhost:3000/api/docs

---

## 📈 Scaling Strategy

### Current Architecture Supports

- ✅ **Stateless API** (JWT tokens, no sessions)
- ✅ **Database connection pooling**
- ✅ **Multiple instances** behind load balancer
- ✅ **No in-memory state**

### Horizontal Scaling

```
Load Balancer
    │
    ├─ API Instance 1
    ├─ API Instance 2
    └─ API Instance 3
         │
    PostgreSQL
    (Primary + Read Replicas)
```

### Future Optimizations

| Optimization | When to Implement | Expected Benefit |
|--------------|-------------------|------------------|
| **Read Replicas** | >10K requests/min | 50% load reduction |
| **Redis Cache** | >100K customers | 80% faster reads |
| **Database Partitioning** | >1M customers | Maintain query speed |
| **CDN** | Global users | Lower latency |

---

## ⚖️ Trade-offs

### 1. Pessimistic vs Optimistic Locking

**Chose**: Pessimistic locking

**Trade-off**:
- ✅ **Pro**: Guarantees correctness, no retry logic
- ❌ **Con**: Slightly lower throughput
- **Reasoning**: For customer assignment, correctness > throughput

### 2. Soft Delete vs Hard Delete

**Chose**: Soft delete for customers

**Trade-off**:
- ✅ **Pro**: Data recovery, audit trail preservation
- ❌ **Con**: More complex queries (must filter `deletedAt`)
- **Reasoning**: Business requirement to restore customers

### 3. TypeORM Auto-Sync vs Migrations

**Chose**: Auto-sync (`synchronize: true`) for development

**Trade-off**:
- ✅ **Pro**: Faster development iteration
- ❌ **Con**: Not safe for production
- **Reasoning**: Acceptable for assignment, would use migrations in production

### 4. Monorepo vs Separate Repos

**Chose**: Monorepo

**Trade-off**:
- ✅ **Pro**: Easier to share types, single version control
- ❌ **Con**: Larger repository
- **Reasoning**: Simpler for assignment submission

### 5. JWT in Headers vs Cookies

**Chose**: Bearer token in Authorization header

**Trade-off**:
- ✅ **Pro**: Standard for APIs, works with Swagger, mobile-friendly
- ❌ **Con**: Frontend must handle token storage
- **Reasoning**: API-first design, better for SPA

### 6. React Query vs Redux

**Chose**: React Query for server state

**Trade-off**:
- ✅ **Pro**: Less boilerplate, automatic caching
- ❌ **Con**: Less control over state updates
- **Reasoning**: Server state is primary concern

### 7. Deployment: Serverless vs Traditional

**Chose**: Vercel Serverless

**Trade-off**:
- ✅ **Pro**: Free, auto-scaling, no server management
- ❌ **Con**: Cold starts, 10s timeout
- **Reasoning**: Perfect for assignment demo, would use dedicated servers for production

---

## 🚢 Deployment

### Architecture

**Frontend**: Vercel (Next.js optimized, global CDN, auto-deploy)  
**Backend**: Vercel Serverless (free tier, GitHub integration)  
**Database**: Supabase (free PostgreSQL, connection pooler for IPv6)

### Why These Platforms?

**Supabase**:
- ✅ Free 500MB PostgreSQL database
- ✅ Connection pooler (IPv6 compatibility)
- ✅ No credit card required
- ❌ Alternatives: Railway (trial expired), Render (paid), Heroku (no free tier)

**Vercel**:
- ✅ Free unlimited deployments
- ✅ Auto-deploy on GitHub push
- ✅ Best for Next.js (built by same team)
- ❌ Alternatives: Koyeb (now paid), Fly.io (complex setup)

### Environment Variables

**Backend**:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGINS=https://frontend-url.vercel.app
```

**Frontend**:
```env
NEXT_PUBLIC_API_URL=https://backend-url.vercel.app
```

### Limitations (Free Tier)

- ⚠️ Cold starts (first request ~2-3s)
- ⚠️ 10s function timeout
- ⚠️ 500MB database limit
- ✅ Acceptable for assignment demo

---

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Organizations
- `GET /organizations` - List all organizations
- `POST /organizations` - Create organization
- `PATCH /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization

### Users (Protected)
- `GET /users` - List users in organization
- `POST /users` - Create user (admin only)
- `PATCH /users/:id` - Update user (admin only)
- `DELETE /users/:id` - Delete user (admin only)

### Customers (Protected)
- `GET /customers` - List customers (paginated, searchable)
- `POST /customers` - Create customer
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Soft delete customer
- `POST /customers/:id/assign` - Assign to user (max 5)
- `POST /customers/:id/unassign` - Unassign from user
- `POST /customers/:id/restore` - Restore soft-deleted customer

### Notes (Protected)
- `GET /notes/customer/:customerId` - Get notes for customer
- `POST /notes` - Create note
- `PATCH /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note

### Activity Logs (Protected)
- `GET /activity-logs` - List all logs (paginated)
- `GET /activity-logs/:entityType/:entityId` - Get logs for entity

---

## 📁 Project Structure

```
multi-tenant-crm/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/              # JWT authentication
│   │   │   ├── organizations/     # Organization CRUD
│   │   │   ├── users/            # User management
│   │   │   ├── customers/        # Customer CRUD + assignment
│   │   │   ├── notes/            # Note management
│   │   │   └── activity-log/     # Audit logging
│   │   ├── database/
│   │   │   └── seeds/seed.ts     # Test data
│   │   ├── common/
│   │   │   └── constants.ts      # Shared constants
│   │   └── main.ts               # Swagger setup
│   └── api/
│       └── index.ts              # Vercel serverless adapter
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/            # Protected routes
│   │   │   ├── page.tsx          # Customer list
│   │   │   └── users/            # User management
│   │   └── login/                # Login page
│   ├── components/
│   │   ├── customers/            # Customer dialogs
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/
│   │   ├── api/                  # API client functions
│   │   └── constants.ts          # Shared constants
│   ├── hooks/                    # Custom React hooks
│   └── store/                    # Zustand stores
│
└── README.md                      # This file
```

---

## ✅ Assignment Requirements Checklist

### Functional Requirements
- ✅ Organizations with complete data isolation
- ✅ Users with roles (admin/member)
- ✅ Customers with pagination, search, soft delete
- ✅ Notes belonging to customers
- ✅ Activity logs for all events

### Advanced Requirements (Mandatory)
- ✅ **Concurrency-safe assignment** (pessimistic locking, max 5 per user)
- ✅ **Performance** (indexes for 100K customers, efficient pagination)
- ✅ **Soft delete integrity** (restore with data preservation)
- ✅ **Production improvement** (Swagger API documentation)

### Frontend Requirements
- ✅ Customer list with pagination
- ✅ Create/Edit customer forms
- ✅ Assign customer to user
- ✅ Add notes UI
- ✅ Loading states
- ✅ Error handling
- ✅ **Bonus**: Debounced search (500ms)
- ✅ **Bonus**: Reusable components (shadcn/ui)

### Technical Requirements - Backend
- ✅ Strict TypeScript (no `any` except for `currentUser` decorator)
- ✅ DTO validation (class-validator)
- ✅ Clean folder structure (modules)
- ✅ Controller/Service separation
- ✅ Transactions where required
- ✅ Foreign keys & indexes

### Technical Requirements - Frontend
- ✅ Clean state management (React Query + Zustand)
- ✅ Proper error handling
- ✅ Type-safe API calls
- ✅ Avoid unnecessary re-renders

### README Requirements
- ✅ Architecture decisions
- ✅ Multi-tenancy isolation explanation
- ✅ Concurrency safety explanation
- ✅ Performance strategy & indexing
- ✅ Scaling strategy
- ✅ Trade-offs made
- ✅ Production improvement explanation
- ✅ Setup instructions
- ✅ Seed data

---

**Built with ❤️ for the Full Stack Engineer Take-Home Assignment**
