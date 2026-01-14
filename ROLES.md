# Role-Based Access Control (RBAC)

This application implements a comprehensive role-based access control system with three distinct roles.

## Roles Overview

### 🟣 OWNER

**Full Access** - Complete control over all features

- ✅ Create tasks
- ✅ Read/view tasks
- ✅ Update/edit tasks
- ✅ Delete tasks
- ✅ Toggle task completion
- ✅ View audit logs

### 🔵 ADMIN

**Administrative Access** - Can manage tasks but cannot delete them

- ✅ Create tasks
- ✅ Read/view tasks
- ✅ Update/edit tasks
- ❌ Delete tasks (restricted)
- ✅ Toggle task completion
- ✅ View audit logs

### ⚪ VIEWER

**Read-Only Access** - Can view and mark tasks complete

- ❌ Create tasks (restricted)
- ✅ Read/view tasks
- ❌ Update/edit tasks (restricted)
- ❌ Delete tasks (restricted)
- ✅ Toggle task completion
- ❌ View audit logs (restricted)

## UI Indicators

### Header Role Badge

The role badge in the header displays your current role with a color-coded indicator:

- **Purple** = OWNER
- **Blue** = ADMIN
- **Gray** = VIEWER

Hover over the badge to see a summary of your permissions.

### Task Card Permission Icons

Each task card shows permission indicators in the top-right corner:

- **Green** icons = You have this permission
- **Gray** icons = You don't have this permission

### Restricted Actions

When you don't have permission for an action:

- Buttons may be hidden completely
- Or shown as disabled with a tooltip explaining the restriction
- A "View-only mode" message appears when you can't create tasks

## Creating Users with Different Roles

### Using Swagger UI (http://localhost:3000/api/docs)

1. Navigate to POST `/auth/register` endpoint
2. Click "Try it out"
3. Enter the user details with the desired role:

```json
{
  "email": "viewer@example.com",
  "password": "password123",
  "role": "VIEWER"
}
```

Available role values:

- `"OWNER"` - Full access
- `"ADMIN"` - Administrative access
- `"VIEWER"` - Read-only access

### Using curl

```bash
# Create OWNER user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123",
    "role": "OWNER"
  }'

# Create ADMIN user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "role": "ADMIN"
  }'

# Create VIEWER user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer@example.com",
    "password": "password123",
    "role": "VIEWER"
  }'
```

## Testing Different Roles

1. **Log out** of your current session
2. **Register** a new user with the desired role
3. **Log in** with the new credentials
4. **Observe** how the UI changes based on your role:
   - Some buttons may disappear
   - Some menu items may be hidden
   - Permission indicators show your capabilities

## Permission System Details

### Backend (NestJS)

- Permissions are enforced at the API level using guards
- Each endpoint checks if the user has the required permission
- Invalid requests return 403 Forbidden errors

### Frontend (Angular)

- The `*hasPermission` directive conditionally shows/hides UI elements
- The `AuthService` checks permissions based on the user's role
- Disabled buttons provide helpful tooltips

## Security Notes

⚠️ **Important**: The role is assigned during registration and stored in the JWT token. Changing a user's role requires creating a new user account or modifying the database directly.

📝 **Development**: In development mode, the database is SQLite and can be cleared by deleting the `dev.db` file and restarting the API server.
