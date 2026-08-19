# Role-Based Sidebar System

This document explains the role-based sidebar system implemented in the IdealiUI application, which provides different sidebar components and menu options based on user roles.

## Overview

The system dynamically renders different sidebar components with role-specific menu items and routing based on the user's role after login. This ensures that each user type sees only the relevant navigation options for their permissions and responsibilities.

## Architecture

### 1. Route Configurations

#### Admin Routes (`src/routes/adminRoutes.tsx`)
- **Target Roles**: admin, administrator, moderator, manager
- **Key Features**:
  - User Management (All Users, Add User, User Reports)
  - Account Management (Billing, Applications, Invoices)
  - Analytics & Reports (Data Tables, Calendar)
  - System Settings (Settings, Security, Notifications)
  - Communication (Messages, Notifications)

#### Member Routes (`src/routes/memberRoutes.tsx`)
- **Target Roles**: user, participant, attendee, member
- **Key Features**:
  - Personal Dashboard
  - Events (Browse Events, My Events, Event History)
  - Profile Management (Overview, Settings, News Feed)
  - My Content (Favorites, Bookmarks, History)
  - Support (Help Center, Contact Support)

#### Organizer Routes (`src/routes/organizerRoutes.tsx`)
- **Target Roles**: organizer, event_organizer, event organizer
- **Key Features**:
  - Event Management (All Events, Create Event, Calendar, Kanban)
  - Attendee Management (All Attendees, Registration, Check-in)
  - Venue & Logistics (Venue Management, Speaker Management, Equipment)
  - Financial Management (Billing, Invoices, Revenue Reports)
  - Analytics (Event Analytics, Attendee Reports, Financial Reports)
  - Settings (Account, Event Settings, Notifications)

### 2. Sidebar Components

#### AdminSidebar (`src/components/sidebar/AdminSidebar.tsx`)
- Uses admin routes configuration
- Full administrative access to all system features
- User management and system administration tools

#### MemberSidebar (`src/components/sidebar/MemberSidebar.tsx`)
- Uses member routes configuration
- User-focused features and personal content management
- Event participation and profile management

#### OrganizerSidebar (`src/components/sidebar/OrganizerSidebar.tsx`)
- Uses organizer routes configuration
- Event creation and management tools
- Attendee and venue management features

### 3. Sidebar Factory (`src/utils/sidebarFactory.ts`)

The sidebar factory provides utility functions for dynamically selecting the appropriate sidebar components:

```typescript
// Get sidebar component based on role
const SidebarComponent = getSidebarComponent(userRole);

// Get responsive sidebar component
const ResponsiveSidebar = getResponsiveSidebarComponent(userRole);

// Get routes for specific role
const routes = getSidebarRoutes(userRole);

// Check route access
const hasAccess = hasRouteAccess(role, '/admin/users/overview');
```

### 4. Role-Based Layout (`src/layouts/admin/RoleBasedAdminLayout.tsx`)

The role-based layout automatically:
- Detects user role from localStorage
- Loads appropriate sidebar component
- Sets up role-specific routing
- Updates navbar branding to show current role

## Role Mappings

| Role | Sidebar Type | Dashboard Route | Key Features |
|------|-------------|----------------|--------------|
| `admin`, `administrator` | Admin | `/admin/dashboards/default` | Full system access, user management |
| `moderator`, `manager` | Admin | `/admin/dashboards/default` | Administrative tools, limited access |
| `organizer`, `event_organizer` | Organizer | `/admin/dashboards/car-interface` | Event management, attendee tools |
| `user`, `participant`, `attendee`, `member` | Member | `/admin/dashboards/smart-home` | Personal dashboard, event participation |
| `rtl`, `rtl_user` | Member | `/admin/dashboards/smart-home` | RTL support with member features |

## Implementation Details

### 1. Dynamic Sidebar Selection

```typescript
// In RoleBasedAdminLayout.tsx
const SidebarComponent = userRole ? getSidebarComponent(userRole) : null;

// Render the appropriate sidebar
{SidebarComponent && (
  <SidebarComponent
    hovered={hovered}
    setHovered={setHovered}
    mini={mini}
    routes={currentRoutes}
    display="none"
    {...rest}
  />
)}
```

### 2. Route Access Control

```typescript
// Check if user has access to specific route
const hasAccess = hasRouteAccess('admin', '/admin/users/overview'); // true
const hasAccess = hasRouteAccess('member', '/admin/users/overview'); // false
```

### 3. Session Management

The system stores both user role and sidebar type in localStorage:

```typescript
localStorage.setItem('userRole', role);
localStorage.setItem('sidebarType', sidebarType);
```

## Usage Examples

### 1. Adding New Roles

To add support for a new role:

1. **Add role mapping in `roleRedirect.ts`**:
```typescript
case 'supervisor':
  return 'admin'; // or appropriate sidebar type
```

2. **Create role-specific routes** (if needed):
```typescript
// In src/routes/supervisorRoutes.tsx
export const supervisorRoutes = [
  // Define supervisor-specific routes
];
```

3. **Update sidebar factory**:
```typescript
case 'supervisor':
  return SupervisorSidebar;
```

### 2. Customizing Menu Items

To add new menu items for a specific role:

1. **Update the appropriate routes file**:
```typescript
// In adminRoutes.tsx
{
  name: 'New Feature',
  path: '/new-feature',
  icon: <Icon as={MdNewFeature} width="20px" height="20px" color="inherit" />,
  collapse: true,
  items: [
    {
      name: 'Feature Overview',
      layout: '/admin',
      path: '/new-feature/overview',
      component: <NewFeatureComponent />,
    },
  ],
}
```

2. **Create the corresponding component** (if needed)

### 3. Role-Based Access Control

```typescript
// Check if current user can access a route
const userRole = getStoredUserRole();
const canAccess = hasRouteAccess(userRole, '/admin/sensitive-data');

if (canAccess) {
  // Render sensitive content
} else {
  // Show access denied or redirect
}
```

## Security Considerations

1. **Client-Side Only**: This system provides UI-level access control. Server-side validation is still required for API endpoints.

2. **Role Validation**: Always validate user roles on the server side before granting access to sensitive operations.

3. **Token Verification**: Ensure JWT tokens are properly validated and contain accurate role information.

4. **Session Management**: Implement proper session cleanup on logout to prevent role persistence.

## Testing

### 1. Test Different Roles

```typescript
// Test admin sidebar
const adminSidebar = getSidebarComponent('admin');
const adminRoutes = getSidebarRoutes('admin');

// Test member sidebar
const memberSidebar = getSidebarComponent('member');
const memberRoutes = getSidebarRoutes('member');
```

### 2. Test Route Access

```typescript
// Test route access for different roles
console.log(hasRouteAccess('admin', '/admin/users/overview')); // true
console.log(hasRouteAccess('member', '/admin/users/overview')); // false
```

## Troubleshooting

### Common Issues

1. **Sidebar Not Loading**: Check if user role is properly stored in localStorage
2. **Wrong Routes**: Verify that the correct routes are loaded for the user's role
3. **Access Denied**: Ensure the user has the appropriate role for the requested route

### Debug Information

The system logs debug information to help troubleshoot:

```typescript
console.log('User Role:', userRole);
console.log('Sidebar Type:', sidebarType);
console.log('Current Routes:', currentRoutes);
```

## Future Enhancements

1. **Dynamic Menu Items**: Load menu items from API based on user permissions
2. **Nested Role Support**: Support for users with multiple roles
3. **Permission-Based Access**: Fine-grained permissions beyond role-based access
4. **Menu Customization**: Allow users to customize their sidebar menu
5. **Real-time Role Updates**: Update sidebar when user role changes without page refresh
