# Testing Guide

Complete guide for testing all backend functionality.

## Prerequisites

1. **Start the server**
```bash
npm run start:dev
```

2. **Seed the database**
```bash
npm run seed
```

3. **Open Swagger UI**
```
http://localhost:3000/api/docs
```

## Test Scenarios

### Scenario 1: Authentication & Multi-Tenancy

**Goal**: Verify JWT authentication and data isolation between organizations.

1. **Login as Org1 Admin**
   - Endpoint: `POST /auth/login`
   - Body:
     ```json
     {
       "email": "admin@acme.com",
       "password": "password123"
     }
     ```
   - Expected: 200 OK with `accessToken`
   - Copy the token

2. **Authorize in Swagger**
   - Click "Authorize" button (top right)
   - Paste token in format: `Bearer YOUR_TOKEN`
   - Click "Authorize"

3. **Get Customers for Org1**
   - Endpoint: `GET /customers`
   - Expected: 10 customers from Acme Corporation

4. **Login as Org2 Admin**
   - Endpoint: `POST /auth/login`
   - Body:
     ```json
     {
       "email": "admin@techstart.com",
       "password": "password123"
     }
     ```
   - Update authorization with new token

5. **Get Customers for Org2**
   - Endpoint: `GET /customers`
   - Expected: 5 different customers from TechStart Inc
   - ✅ **Verify**: No overlap with Org1 customers

### Scenario 2: Customer CRUD Operations

**Goal**: Test create, read, update, delete operations.

1. **Create Customer**
   - Endpoint: `POST /customers`
   - Body:
     ```json
     {
       "name": "Test Customer",
       "email": "test@example.com",
       "phone": "555-9999"
     }
     ```
   - Expected: 201 Created
   - Copy the customer `id`

2. **Get Customer**
   - Endpoint: `GET /customers/{id}`
   - Expected: 200 OK with customer details

3. **Update Customer**
   - Endpoint: `PATCH /customers/{id}`
   - Body:
     ```json
     {
       "name": "Updated Customer",
       "phone": "555-8888"
     }
     ```
   - Expected: 200 OK with updated data

4. **Soft Delete Customer**
   - Endpoint: `DELETE /customers/{id}`
   - Expected: 200 OK

5. **Verify Soft Delete**
   - Endpoint: `GET /customers`
   - Expected: Deleted customer NOT in list

6. **Restore Customer**
   - Endpoint: `POST /customers/{id}/restore`
   - Expected: 200 OK

7. **Verify Restore**
   - Endpoint: `GET /customers`
   - Expected: Customer back in list

### Scenario 3: Pagination & Search

**Goal**: Test pagination and search functionality.

1. **Get First Page**
   - Endpoint: `GET /customers?page=1&limit=5`
   - Expected: 5 customers, total count in response

2. **Get Second Page**
   - Endpoint: `GET /customers?page=2&limit=5`
   - Expected: Next 5 customers

3. **Search by Name**
   - Endpoint: `GET /customers?search=Customer 1`
   - Expected: Customers matching "Customer 1"

4. **Search by Email**
   - Endpoint: `GET /customers?search=customer1@example.com`
   - Expected: Customer with that email

### Scenario 4: Concurrency-Safe Assignment

**Goal**: Test the 5-customer limit with race condition prevention.

1. **Get User ID**
   - Endpoint: `GET /users`
   - Copy a member user's `id`

2. **Assign 5 Customers**
   - Endpoint: `POST /customers/{id}/assign`
   - Body: `{"userId": "USER_ID"}`
   - Repeat for 5 different customers
   - Expected: All 5 succeed

3. **Try 6th Assignment**
   - Endpoint: `POST /customers/{id}/assign`
   - Body: `{"userId": "USER_ID"}`
   - Expected: **400 Bad Request** - "User already has maximum 5 active customers"
   - ✅ **Verify**: Limit enforced

4. **Soft Delete One Assigned Customer**
   - Endpoint: `DELETE /customers/{id}` (one of the assigned)
   - Expected: 200 OK

5. **Try Assignment Again**
   - Endpoint: `POST /customers/{id}/assign`
   - Body: `{"userId": "USER_ID"}`
   - Expected: **200 OK** (now only 4 active)
   - ✅ **Verify**: Soft-deleted customers don't count

### Scenario 5: Notes Management

**Goal**: Test note creation and retrieval.

1. **Get Customer ID**
   - Endpoint: `GET /customers`
   - Copy a customer `id`

2. **Create Note**
   - Endpoint: `POST /notes`
   - Body:
     ```json
     {
       "content": "Called customer, interested in premium plan",
       "customerId": "CUSTOMER_ID"
     }
     ```
   - Expected: 201 Created

3. **Get Notes for Customer**
   - Endpoint: `GET /notes/customer/{customerId}`
   - Expected: List of notes for that customer

4. **Create Another Note**
   - Endpoint: `POST /notes`
   - Body:
     ```json
     {
       "content": "Follow-up scheduled for next week",
       "customerId": "CUSTOMER_ID"
     }
     ```
   - Expected: 201 Created

5. **Verify Multiple Notes**
   - Endpoint: `GET /notes/customer/{customerId}`
   - Expected: Both notes in list

### Scenario 6: Activity Logging

**Goal**: Verify audit trail is working.

1. **Perform Actions**
   - Create a customer
   - Update the customer
   - Assign to user
   - Create a note
   - Soft delete customer
   - Restore customer

2. **Get All Activity Logs**
   - Endpoint: `GET /activity-logs?page=1&limit=50`
   - Expected: All actions logged with:
     - action (customer_created, customer_updated, etc.)
     - entityType (customer, note)
     - entityId
     - userId (who performed it)
     - metadata (additional context)
     - timestamp

3. **Get Logs for Specific Customer**
   - Endpoint: `GET /activity-logs/customer/{customerId}`
   - Expected: Only logs for that customer

### Scenario 7: Role-Based Access Control

**Goal**: Test admin-only endpoints.

1. **Login as Member**
   - Endpoint: `POST /auth/login`
   - Body:
     ```json
     {
       "email": "jane@acme.com",
       "password": "password123"
     }
     ```
   - Update authorization

2. **Try to Create User (Should Fail)**
   - Endpoint: `POST /users`
   - Body:
     ```json
     {
       "name": "New User",
       "email": "new@acme.com",
       "password": "password123",
       "organizationId": "ORG_ID"
     }
     ```
   - Expected: **403 Forbidden** (member cannot create users)

3. **Login as Admin**
   - Endpoint: `POST /auth/login`
   - Body:
     ```json
     {
       "email": "admin@acme.com",
       "password": "password123"
     }
     ```
   - Update authorization

4. **Create User (Should Succeed)**
   - Endpoint: `POST /users`
   - Same body as above
   - Expected: **201 Created**
   - ✅ **Verify**: Only admins can create users

### Scenario 8: Soft Delete Integrity

**Goal**: Verify notes and logs are preserved after soft delete.

1. **Create Customer with Notes**
   - Create customer
   - Add 2-3 notes to customer
   - Copy customer ID

2. **Get Notes Before Delete**
   - Endpoint: `GET /notes/customer/{customerId}`
   - Expected: All notes visible

3. **Soft Delete Customer**
   - Endpoint: `DELETE /customers/{id}`
   - Expected: 200 OK

4. **Verify Customer Hidden**
   - Endpoint: `GET /customers`
   - Expected: Customer NOT in list

5. **Get Notes After Delete**
   - Endpoint: `GET /notes/customer/{customerId}`
   - Expected: **Notes still accessible**
   - ✅ **Verify**: Notes preserved

6. **Get Activity Logs**
   - Endpoint: `GET /activity-logs/customer/{customerId}`
   - Expected: **All logs still accessible**
   - ✅ **Verify**: Audit trail preserved

7. **Restore Customer**
   - Endpoint: `POST /customers/{id}/restore`
   - Expected: 200 OK

8. **Verify Everything Restored**
   - Endpoint: `GET /customers/{id}`
   - Expected: Customer visible again
   - Notes and logs still intact

## Concurrent Request Testing

### Test Concurrency with cURL

**Setup:**
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}' \
  | jq -r '.accessToken')

# Get user ID and customer IDs
USER_ID="..." # From GET /users
CUSTOMER_IDS=("id1" "id2" "id3" "id4" "id5" "id6" "id7" "id8" "id9" "id10")
```

**Test 1: Concurrent Assignments (Race Condition)**
```bash
# Try to assign 10 customers simultaneously
for id in "${CUSTOMER_IDS[@]}"; do
  curl -X POST "http://localhost:3000/customers/$id/assign" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$USER_ID\"}" &
done
wait

# Expected: Only 5 succeed, rest fail with 400
```

**Test 2: Concurrent Creates**
```bash
# Create 10 customers simultaneously
for i in {1..10}; do
  curl -X POST http://localhost:3000/customers \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Concurrent Customer $i\",\"email\":\"concurrent$i@test.com\"}" &
done
wait

# Expected: All 10 succeed (no conflicts)
```

## Performance Testing

### Test with Large Dataset

1. **Create 100 Customers**
```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/customers \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Customer $i\",\"email\":\"customer$i@perf.test\"}"
done
```

2. **Test Pagination Performance**
```bash
# Should be fast even with 100+ customers
time curl "http://localhost:3000/customers?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

3. **Test Search Performance**
```bash
# Should use index for fast search
time curl "http://localhost:3000/customers?search=Customer 5" \
  -H "Authorization: Bearer $TOKEN"
```

## Expected Results Summary

| Test | Expected Result |
|------|----------------|
| Multi-tenancy | ✅ Complete data isolation |
| Authentication | ✅ JWT tokens work |
| CRUD Operations | ✅ All operations succeed |
| Pagination | ✅ Correct page/limit behavior |
| Search | ✅ Case-insensitive matching |
| 5-Customer Limit | ✅ 6th assignment fails |
| Soft Delete | ✅ Hidden from queries |
| Restore | ✅ Customer reappears |
| Notes Preservation | ✅ Notes survive soft delete |
| Activity Logs | ✅ All actions logged |
| Admin-Only | ✅ Members blocked from admin endpoints |
| Concurrency | ✅ Race conditions prevented |

## Troubleshooting

### 401 Unauthorized
- Token expired (7 days)
- Token not in Authorization header
- Solution: Login again and update token

### 403 Forbidden
- Trying admin endpoint as member
- Solution: Login as admin user

### 404 Not Found
- Customer soft-deleted
- Wrong organization
- Solution: Check customer exists and belongs to your org

### 400 Bad Request
- Validation failed
- 5-customer limit reached
- Solution: Check error message for details

## Automation Script

Save as `test-all.sh`:
```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

# Login
echo "🔐 Testing authentication..."
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}' \
  | jq -r '.accessToken')

echo "✅ Got token: ${TOKEN:0:20}..."

# Create customer
echo "📝 Creating customer..."
CUSTOMER=$(curl -s -X POST $BASE_URL/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","email":"test@example.com"}')

CUSTOMER_ID=$(echo $CUSTOMER | jq -r '.id')
echo "✅ Created customer: $CUSTOMER_ID"

# Get customers
echo "📋 Getting customers..."
curl -s "$BASE_URL/customers?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data | length'

echo "✅ All tests passed!"
```

Run with:
```bash
chmod +x test-all.sh
./test-all.sh
```
