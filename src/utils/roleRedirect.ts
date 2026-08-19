/**
 * Role-based redirection utility
 * Maps user roles to appropriate dashboard routes
 */

export interface UserRole {
  role: string;
  userId?: string;
  organizerId?: string;
}

export const getDashboardRoute = (role: string): string => {
  // Normalize role to lowercase for comparison
  const normalizedRole = role.toLowerCase().trim();
  
  // Role-based routing logic
  switch (normalizedRole) {
    case 'admin':
    case 'administrator':
      return '/admin/admin-dashboard';
    
    case 'organizer':
    case 'event_organizer':
    case 'event organizer':
      return '/organizer/organizer-dashboard';
    
    case 'donor':
    case 'user':
    case 'participant':
    case 'attendee':
    case 'member':
      return '/member/dashboard';
    
    case 'moderator':
    case 'manager':
      return '/admin/dashboard';
    
    case 'rtl':
    case 'rtl_user':
      return '/rtl/dashboards/rtl';
    
    // Default fallback
    default:
      console.warn(`Unknown role: ${role}. Redirecting to default dashboard.`);
      return '/admin/dashboard';
  }
};

export const getSidebarType = (role: string): string => {
  // Normalize role to lowercase for comparison
  const normalizedRole = role.toLowerCase().trim();
  
  // Role-based sidebar type logic
  switch (normalizedRole) {
    case 'admin':
    case 'administrator':
    case 'moderator':
    case 'manager':
      return 'admin';
    
    case 'organizer':
    case 'event_organizer':
    case 'event organizer':
      return 'organizer';
    
    case 'user':
    case 'participant':
    case 'attendee':
    case 'member':
      return 'member';
    
    case 'rtl':
    case 'rtl_user':
      return 'member'; // RTL users get member sidebar for now
    
    // Default fallback
    default:
      console.warn(`Unknown role: ${role}. Using default admin sidebar.`);
      return 'admin';
  }
};

export const redirectAfterLogin = (role: string, userId?: string, organizerId?: string): void => {
   const dashboardRoute = getDashboardRoute(role);
   const sidebarType = getSidebarType(role);
  
// for organizer
//   const dashboardRoute = getDashboardRoute('organizer');
//  const sidebarType = getSidebarType('organizer');
  // Store additional user context if needed
  // if (userId) {
  //   localStorage.setItem('userId', userId);
  // }
  // if (organizerId) {
  //   localStorage.setItem('organizerId', organizerId);
  // }
  
  // // Store the role and sidebar type for future use
  // localStorage.setItem('userRole', role);
  localStorage.setItem('sidebarType', sidebarType);
  
  // Redirect to the appropriate dashboard
  window.location.href = dashboardRoute;
};

export const getStoredUserRole = (): string | null => {
  return localStorage.getItem('userRole');
};

export const getStoredSidebarType = (): string | null => {
  return localStorage.getItem('sidebarType');
};

export const clearUserSession = (): void => {
  localStorage.removeItem('AuthToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('sidebarType');
  localStorage.removeItem('userId');
  localStorage.removeItem('organizerId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userOrg');
};
