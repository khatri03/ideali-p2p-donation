/**
 * Sidebar Factory Utility
 * Dynamically selects the appropriate sidebar component based on user role
 */

import React from 'react';
import AdminSidebar, { AdminSidebarResponsive } from '../themeComponents/sidebar/AdminSidebar';
import MemberSidebar, { MemberSidebarResponsive } from '../themeComponents/sidebar/MemberSidebar';
import OrganizerSidebar, { OrganizerSidebarResponsive } from '../themeComponents/sidebar/OrganizerSidebar';

export type SidebarType = 'admin' | 'member' | 'organizer' | 'default';

export interface SidebarProps {
  mini?: boolean;
  hovered?: boolean;
  setHovered?: (hovered: boolean) => void;
  [x: string]: any;
}

/**
 * Get the appropriate sidebar component based on user role
 */
export const getSidebarComponent = (role: string): React.ComponentType<SidebarProps> => {
  const normalizedRole = role.toLowerCase().trim();
  
  switch (normalizedRole) {
    case 'admin':
    case 'administrator':
    case 'moderator':
    case 'manager':
      return AdminSidebar;
    
    case 'organizer':
    case 'event_organizer':
    case 'event organizer':
      return OrganizerSidebar;
    
    case 'user':
    case 'participant':
    case 'attendee':
    case 'member':
      return MemberSidebar;
    
    case 'rtl':
    case 'rtl_user':
      return MemberSidebar; // RTL users get member sidebar for now
    
    default:
      console.warn(`Unknown role: ${role}. Using default admin sidebar.`);
      return AdminSidebar;
  }
};

/**
 * Get the appropriate responsive sidebar component based on user role
 */
export const getResponsiveSidebarComponent = (role: string): React.ComponentType<SidebarProps> => {
  const normalizedRole = role.toLowerCase().trim();
  
  switch (normalizedRole) {
    case 'admin':
    case 'administrator':
    case 'moderator':
    case 'manager':
      return AdminSidebarResponsive;
    
    case 'organizer':
    case 'event_organizer':
    case 'event organizer':
      return OrganizerSidebarResponsive;
    
    case 'user':
    case 'participant':
    case 'attendee':
    case 'member':
      return MemberSidebarResponsive;
    
    case 'rtl':
    case 'rtl_user':
      return MemberSidebarResponsive; // RTL users get member sidebar for now
    
    default:
      console.warn(`Unknown role: ${role}. Using default admin responsive sidebar.`);
      return AdminSidebarResponsive;
  }
};

/**
 * Get the appropriate routes for the sidebar based on user role
 */
export const getSidebarRoutes = (role: string) => {
  const normalizedRole = role.toLowerCase().trim();
  
  switch (normalizedRole) {
    case 'admin':
    case 'administrator':
    case 'moderator':
    case 'manager':
      return require('../routes/adminRoutes').adminRoutes;
    
    case 'organizer':
    case 'event_organizer':
    case 'event organizer':
      return require('../routes/organizerRoutes').organizerRoutes;
    
    case 'user':
    case 'participant':
    case 'attendee':
    case 'member':
      return require('../routes/memberRoutes').memberRoutes;
    
    case 'rtl':
    case 'rtl_user':
      return require('../routes/memberRoutes').memberRoutes; // RTL users get member routes for now
    
    default:
      console.warn(`Unknown role: ${role}. Using default admin routes.`);
      return require('../routes/adminRoutes').adminRoutes;
  }
};

/**
 * Get sidebar type for debugging/logging purposes
 */
export const getSidebarType = (role: string): SidebarType => {
  const normalizedRole = role.toLowerCase().trim();
  
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
    
    default:
      return 'default';
  }
};

/**
 * Check if a role has access to a specific route
 */
export const hasRouteAccess = (role: string, routePath: string): boolean => {
  const routes = getSidebarRoutes(role);
  
  // Helper function to check if route exists in the routes array
  const checkRoute = (routesArray: any[], path: string): boolean => {
    for (const route of routesArray) {
      if (route.path === path) {
        return true;
      }
      if (route.items && route.items.length > 0) {
        if (checkRoute(route.items, path)) {
          return true;
        }
      }
    }
    return false;
  };
  
  return checkRoute(routes, routePath);
};

/**
 * Get all available routes for a specific role
 */
export const getAvailableRoutes = (role: string): string[] => {
  const routes = getSidebarRoutes(role);
  const availableRoutes: string[] = [];
  
  const extractRoutes = (routesArray: any[]) => {
    routesArray.forEach(route => {
      if (route.path) {
        availableRoutes.push(route.path);
      }
      if (route.items && route.items.length > 0) {
        extractRoutes(route.items);
      }
    });
  };
  
  extractRoutes(routes);
  return availableRoutes;
};
