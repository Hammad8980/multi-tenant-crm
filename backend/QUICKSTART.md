# 🚀 Quick Start Guide

Get the CRM backend running in 5 minutes!

## Prerequisites
- Node.js v18+
- PostgreSQL v14+
- npm

## Step 1: Install Dependencies
```bash
cd backend
npm install
```

## Step 2: Setup Database
```bash
# Create database
createdb crm_db

# Or using psql
psql -U postgres
CREATE DATABASE crm_db;
\q
```

## Step 3: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` if needed (default values work for local PostgreSQL):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=crm_db
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

## Step 4: Start the Server
```bash
npm run start:dev
```

The server will:
- ✅ Auto-create database tables (TypeORM sync)
- ✅ Start on http://localhost:3000
- ✅ Serve Swagger docs at http://localhost:3000/api/docs

## Step 5: Seed Test Data
```bash
# In a new terminal
npm run seed
```

This creates:
- 2 Organizations
- 4 Users (with credentials below)
- 15 Customers
- 3 Notes

## Step 6: Test the API

### Option A: Using Swagger UI (Recommended)
1. Open http://localhost:3000/api/docs
2. Click "Authorize" button
3. Login to get token:
   - Click "POST /auth/login"
   - Click "Try it out"
   - Use credentials: `admin@acme.com` / `password123`
   - Click "Execute"
   - Copy the `accessToken` from response
4. Paste token in "Authorize" dialog
5. Now you can test all endpoints!

### Option B: Using Postman
1. Import `postman_collection.json`
2. Send "Login" request (auto-saves token)
3. Test other endpoints

### Option C: Using cURL
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}'

# Copy the accessToken from response, then:

# Get customers
curl http://localhost:3000/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Test Credentials

| Email | Password | Role | Organization |
|-------|----------|------|--------------|
| admin@acme.com | password123 | admin | Acme Corporation |
| jane@acme.com | password123 | member | Acme Corporation |
| bob@acme.com | password123 | member | Acme Corporation |
| admin@techstart.com | password123 | admin | TechStart Inc |

## Key Endpoints to Test

### 1. Authentication
- `POST /auth/login` - Get JWT token

### 2. Customers (Protected)
- `GET /customers` - List customers (paginated)
- `POST /customers` - Create customer
- `POST /customers/:id/assign` - Assign to user (max 5)
- `DELETE /customers/:id` - Soft delete
- `POST /customers/:id/restore` - Restore deleted

### 3. Notes (Protected)
- `POST /notes` - Add note to customer
- `GET /notes/customer/:customerId` - Get customer notes

### 4. Activity Logs (Protected)
- `GET /activity-logs` - View audit trail

## Testing Multi-Tenancy

1. Login as `admin@acme.com` (Org 1)
2. Get customers - you'll see 10 customers
3. Login as `admin@techstart.com` (Org 2)
4. Get customers - you'll see 5 different customers
5. ✅ Data is completely isolated!

## Testing Concurrency Safety

Try assigning 6 customers to the same user:
```bash
# Get a userId from GET /users
# Get customer IDs from GET /customers

# Try assigning 6 customers (only 5 should succeed)
for i in {1..6}; do
  curl -X POST http://localhost:3000/customers/CUSTOMER_ID_$i/assign \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"userId":"USER_ID"}'
done
```

Expected: 5 succeed, 6th returns 400 error.

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Check credentials in .env match your PostgreSQL setup
```

### Port Already in Use
```bash
# Change PORT in .env to 3001 or another available port
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- 📚 Read full [README.md](./README.md) for architecture details
- 🔍 Explore Swagger docs at http://localhost:3000/api/docs
- 🧪 Import Postman collection for easier testing
- 📝 Check activity logs to see audit trail

## Need Help?

- Check the comprehensive [README.md](./README.md)
- Review Swagger documentation
- Inspect seed data in `src/database/seeds/seed.ts`
