# Role-Based Redirection After Login

This document explains how the role-based redirection system works in the IdealiUI application.

## Overview

After a successful login, users are automatically redirected to different dashboards based on their role. This ensures that each user type sees the most relevant interface for their needs.

## Implementation

### 1. Role Redirection Utility (`src/utils/roleRedirect.ts`)

The utility provides functions for:
- `getDashboardRoute(role: string)`: Maps user roles to appropriate dashboard routes
- `redirectAfterLogin(role: string, userId?: string, organizerId?: string)`: Handles the complete redirection process
- `getStoredUserRole()`: Retrieves the stored user role
- `clearUserSession()`: Clears all user session data

### 2. Role Mappings

| Role | Dashboard Route | Description |
|------|----------------|-------------|
| `admin`, `administrator` | `/admin/dashboards/default` | Main admin dashboard |
| `organizer`, `event_organizer` | `/admin/dashboards/car-interface` | Event organizer dashboard |
| `user`, `participant`, `attendee` | `/admin/dashboards/smart-home` | User/participant dashboard |
| `moderator`, `manager` | `/admin/dashboards/default` | Management dashboard |
| `rtl`, `rtl_user` | `/rtl/dashboards/rtl` | RTL (Right-to-Left) dashboard |
| `unknown_role` | `/admin/dashboards/default` | Default fallback |

### 3. SignIn Component Integration

The `SignIn` component (`src/app/components/accountComponents/SignIn.tsx`) has been updated to:

1. Extract the user role from the JWT token or API response
2. Store user information in localStorage
3. Show a success message
4. Redirect to the appropriate dashboard after a 1.5-second delay

## Usage

### Automatic Redirection

When a user logs in successfully:

1. The system extracts the role from the authentication response
2. User data is stored in localStorage
3. A success toast notification is shown
4. After 1.5 seconds, the user is redirected to their role-specific dashboard

### Manual Role Checking

```typescript
import { getDashboardRoute, getStoredUserRole } from '../utils/roleRedirect';

// Get the current user's role
const userRole = getStoredUserRole();

// Get the appropriate dashboard route for a role
const dashboardRoute = getDashboardRoute('admin'); // Returns '/admin/dashboards/default'
```

### Session Management

```typescript
import { clearUserSession } from '../utils/roleRedirect';

// Clear all user session data (useful for logout)
clearUserSession();
```

## Available Dashboards

Based on the routes configuration, the following dashboards are available:

1. **Main Dashboard** (`/admin/dashboards/default`)
   - Default admin interface
   - Used for admin, administrator, moderator, and manager roles

2. **Car Interface Dashboard** (`/admin/dashboards/car-interface`)
   - Event organizer interface
   - Used for organizer and event_organizer roles

3. **Smart Home Dashboard** (`/admin/dashboards/smart-home`)
   - User/participant interface
   - Used for user, participant, and attendee roles

4. **RTL Dashboard** (`/rtl/dashboards/rtl`)
   - Right-to-left language support
   - Used for rtl and rtl_user roles

## Customization

### Adding New Roles

To add support for new roles:

1. Update the `getDashboardRoute` function in `src/utils/roleRedirect.ts`
2. Add the new role mapping to the switch statement
3. Ensure the corresponding dashboard route exists in `src/routes.tsx`

Example:
```typescript
case 'supervisor':
  return '/admin/dashboards/supervisor-dashboard';
```

### Modifying Role Mappings

To change which dashboard a role redirects to:

1. Update the `getDashboardRoute` function in `src/utils/roleRedirect.ts`
2. Ensure the new route exists in your routing configuration

## Testing

A test file is available at `src/utils/roleRedirect.test.ts` that demonstrates:
- Role-to-route mapping
- Function behavior with different inputs
- Mock localStorage and window.location usage

## Security Considerations

- User roles are extracted from JWT tokens for security
- Fallback to API response data if JWT role extraction fails
- Default role is 'user' if no role is found
- All user session data is stored in localStorage (consider using more secure storage for production)

## Error Handling

- Unknown roles default to the main admin dashboard
- Console warnings are logged for unknown roles
- Graceful fallback to default behavior
- User-friendly error messages in the UI
