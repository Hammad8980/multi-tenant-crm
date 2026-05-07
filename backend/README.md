# Multi-Tenant CRM System - Backend

A production-grade multi-tenant CRM system built with NestJS, TypeScript, and PostgreSQL. Features concurrency-safe operations, soft delete, activity logging, and comprehensive API documentation.

## 🚀 Features

- **Multi-Tenancy**: Complete data isolation between organizations
- **Authentication**: JWT-based authentication with role-based access control
- **Concurrency Safety**: Pessimistic locking for customer assignment (max 5 per user)
- **Soft Delete**: Customers can be soft-deleted and restored
- **Activity Logging**: Comprehensive audit trail for all operations
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Performance Optimized**: Database indexes for 100K+ customers per organization
- **Type Safety**: Strict TypeScript with no `any` types (except for currentUser context)

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=crm_db

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

PORT=3000
```

4. **Create database**
```bash
createdb crm_db
```

5. **Run the application** (auto-syncs schema)
```bash
npm run start:dev
```

6. **Seed the database** (optional but recommended)
```bash
npm run seed
```

## 📚 API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs

The Swagger documentation provides:
- Interactive API testing
- Request/response schemas
- Authentication setup
- Example payloads

## 🏗️ Architecture

### Project Structure
```
src/
├── modules/
│   ├── auth/              # JWT authentication & guards
│   ├── organizations/     # Organization management
│   ├── users/            # User management (admin-only create)
│   ├── customers/        # Customer CRUD with soft delete
│   ├── notes/            # Customer notes
│   └── activity-log/     # Audit logging
├── database/
│   ├── database.config.ts
│   └── seeds/            # Seed data scripts
└── main.ts               # Application entry point
```

### Entity Relationships
```
Organization (1) ──→ (N) Users
Organization (1) ──→ (N) Customers
User (1) ──→ (N) Customers (assignedTo)
Customer (1) ──→ (N) Notes
```

## 🔒 Multi-Tenancy Isolation

### How It Works
Every entity (except Organization) includes an `organizationId` field. All queries automatically filter by the authenticated user's `organizationId`:

```typescript
// Example from CustomersService
async findAll(currentUser: any) {
  return this.customerRepository.find({
    where: {
      organizationId: currentUser.organizationId, // ✅ Enforced
    },
  });
}
```

### Enforcement Points
1. **JWT Strategy**: Extracts `organizationId` from user record
2. **CurrentUser Decorator**: Injects user context into controllers
3. **Service Layer**: All queries filter by `organizationId`
4. **Database Indexes**: Composite indexes on `(organizationId, ...)` for performance

### Security Guarantees
- ✅ Users can only see data from their organization
- ✅ Cross-tenant data access is impossible
- ✅ Foreign keys prevent orphaned records
- ✅ Indexes ensure queries remain fast at scale

## ⚡ Concurrency Safety

### The Problem
Multiple requests trying to assign customers to the same user could exceed the 5-customer limit due to race conditions.

### The Solution
**Pessimistic Locking** with database transactions:

```typescript
async assignCustomer(customerId: string, userId: string, currentUser: any) {
  return await this.dataSource.transaction(async (manager) => {
    // 1. Lock rows during count
    const activeAssignments = await manager
      .createQueryBuilder(Customer, 'customer')
      .setLock('pessimistic_write')  // 🔒 Database-level lock
      .where('customer.assignedTo = :userId', { userId })
      .andWhere('customer.deletedAt IS NULL')
      .getCount();

    // 2. Enforce limit
    if (activeAssignments >= 5) {
      throw new BadRequestException('User already has maximum 5 active customers');
    }

    // 3. Assign customer
    await manager.update(Customer, { id: customerId }, { assignedTo: userId });
  });
}
```

### Why This Works
1. **Pessimistic Write Lock**: Prevents other transactions from reading/writing locked rows
2. **Transaction Isolation**: All operations are atomic (all-or-nothing)
3. **Database-Level**: Works across multiple server instances
4. **Race Condition Proof**: Concurrent requests are serialized by the database

### Testing Concurrency
```bash
# Run 10 concurrent assignment requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/customers/{id}/assign \
    -H "Authorization: Bearer {token}" \
    -H "Content-Type: application/json" \
    -d '{"userId": "{userId}"}' &
done
```
Expected: Only 5 succeed, rest return 400 error.

## 🚄 Performance Strategy

### Database Indexes
```typescript
// Customer entity
@Index(['organizationId'])                    // Multi-tenancy queries
@Index(['assignedTo', 'organizationId'])      // Assignment queries
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
1. **Pagination**: All list endpoints support `page` and `limit` parameters
2. **Selective Loading**: Only load required fields (no `SELECT *`)
3. **Soft Delete Filtering**: Indexed `deletedAt IS NULL` checks
4. **Composite Indexes**: Multi-column indexes for common query patterns

### N+1 Query Prevention
- Use `relations` in TypeORM queries when needed
- Avoid lazy loading in loops
- Use `QueryBuilder` with joins for complex queries

### Scaling to 100K+ Customers
- ✅ Indexed `organizationId` ensures O(log n) lookups
- ✅ Pagination prevents loading entire datasets
- ✅ Soft delete uses indexed column (no table scans)
- ✅ Composite indexes optimize multi-tenant queries

## 🗑️ Soft Delete Integrity

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
2. **Normal Queries**: Filter `WHERE deletedAt IS NULL`
3. **Restore**: Sets `deletedAt` back to NULL
4. **Related Data**: Notes and activity logs remain intact

### Restore Functionality
```typescript
async restore(id: string, currentUser: any) {
  const customer = await this.customerRepository.findOne({
    where: { id, organizationId: currentUser.organizationId },
    withDeleted: true,  // Include soft-deleted records
  });

  if (!customer.deletedAt) {
    throw new BadRequestException('Customer is not deleted');
  }

  await this.customerRepository.restore(id);
  return this.findOne(id, currentUser);
}
```

## 📊 Activity Logging

### Tracked Events
- `customer_created`
- `customer_updated`
- `customer_deleted`
- `customer_restored`
- `customer_assigned`
- `note_added`

### Log Structure
```typescript
{
  id: string;
  action: string;           // Event type
  entityType: string;       // 'customer', 'note', etc.
  entityId: string;         // ID of affected entity
  organizationId: string;   // Tenant isolation
  userId: string;           // Who performed the action
  metadata: object;         // Additional context
  createdAt: Date;          // When it happened
}
```

### Usage
```typescript
// Automatically logged in services
await this.activityLogService.log(
  'customer_created',
  'customer',
  customer.id,
  currentUser.organizationId,
  currentUser.userId,
  { name: customer.name, email: customer.email }
);
```

## 🎯 Production Improvement: Swagger API Documentation

### Why Swagger?
1. **Developer Experience**: Interactive API testing without Postman
2. **Documentation**: Auto-generated from code (always up-to-date)
3. **Type Safety**: Request/response schemas validated
4. **Onboarding**: New developers can explore API instantly
5. **Client Generation**: Can generate TypeScript/JavaScript clients

### Features
- ✅ JWT authentication support
- ✅ Request/response examples
- ✅ Schema validation
- ✅ Try-it-out functionality
- ✅ Organized by tags (auth, customers, users, etc.)

### Access
Visit http://localhost:3000/api/docs after starting the server.

## 🧪 Testing

### Seed Data
```bash
npm run seed
```

Creates:
- 2 Organizations (Acme Corporation, TechStart Inc)
- 4 Users (2 admins, 2 members)
- 15 Customers (10 for Org1, 5 for Org2)
- 3 Notes

### Test Credentials
```
Org1 Admin:  admin@acme.com / password123
Org1 Member: jane@acme.com / password123
Org1 Member: bob@acme.com / password123
Org2 Admin:  admin@techstart.com / password123
```

### Manual Testing Flow
1. **Login**: POST `/auth/login` with credentials
2. **Get Token**: Copy `accessToken` from response
3. **Set Auth**: In Swagger, click "Authorize" and paste token
4. **Test Endpoints**: Try creating customers, assigning users, etc.

## 📈 Scaling Strategy

### Horizontal Scaling
- ✅ Stateless API (JWT tokens, no sessions)
- ✅ Database connection pooling
- ✅ Can run multiple instances behind load balancer

### Database Scaling
1. **Read Replicas**: Route read queries to replicas
2. **Partitioning**: Partition by `organizationId` for large datasets
3. **Caching**: Add Redis for frequently accessed data
4. **Connection Pooling**: Configure TypeORM pool size

### Future Optimizations
- [ ] Redis caching for user sessions
- [ ] Background jobs for activity log processing
- [ ] Database query result caching
- [ ] CDN for static assets
- [ ] Rate limiting per organization

## ⚖️ Trade-offs Made

### 1. Pessimistic vs Optimistic Locking
**Chose**: Pessimistic locking
**Why**: Guarantees correctness over throughput. For customer assignment, correctness is critical.
**Trade-off**: Slightly lower concurrency, but acceptable for this use case.

### 2. Soft Delete vs Hard Delete
**Chose**: Soft delete for customers only
**Why**: Business requirement to restore customers and preserve audit trail.
**Trade-off**: Slightly more complex queries (must filter `deletedAt`), but worth it for data recovery.

### 3. TypeORM Auto-Sync vs Migrations
**Chose**: Auto-sync (`synchronize: true`)
**Why**: Faster development iteration for take-home assignment.
**Production**: Should use migrations for production deployments.

### 4. Activity Logs in Same Database
**Chose**: Store logs in same PostgreSQL database
**Why**: Simpler architecture, transactional consistency.
**Alternative**: Could use separate logging service (e.g., Elasticsearch) for scale.

### 5. JWT in Headers vs Cookies
**Chose**: Bearer token in Authorization header
**Why**: Standard for API-first applications, works with Swagger.
**Trade-off**: Frontend must handle token storage (localStorage/sessionStorage).

## 🔧 Available Scripts

```bash
npm run start:dev    # Development mode with hot reload
npm run build        # Build for production
npm run start:prod   # Run production build
npm run seed         # Seed database with test data
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Organizations
- `GET /organizations` - List all organizations
- `POST /organizations` - Create organization
- `GET /organizations/:id` - Get organization
- `PATCH /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization

### Users (Protected)
- `GET /users` - List users in organization
- `POST /users` - Create user (admin only)
- `GET /users/:id` - Get user
- `PATCH /users/:id` - Update user (admin only)
- `DELETE /users/:id` - Delete user (admin only)

### Customers (Protected)
- `GET /customers` - List customers (paginated, searchable)
- `POST /customers` - Create customer
- `GET /customers/:id` - Get customer
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Soft delete customer
- `POST /customers/:id/assign` - Assign to user (max 5)
- `POST /customers/:id/restore` - Restore soft-deleted customer

### Notes (Protected)
- `GET /notes/customer/:customerId` - Get notes for customer
- `POST /notes` - Create note
- `GET /notes/:id` - Get note
- `PATCH /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note

### Activity Logs (Protected)
- `GET /activity-logs` - List all logs (paginated)
- `GET /activity-logs/:entityType/:entityId` - Get logs for entity

## 🤝 Contributing

This is a take-home assignment project. For production use, consider:
- Adding comprehensive unit tests
- Implementing database migrations
- Adding rate limiting
- Setting up CI/CD pipeline
- Adding monitoring and logging
- Implementing caching layer

## 📄 License

MIT
