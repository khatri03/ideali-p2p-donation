import HttpClient from 'app/service/httpClient/HttpClient';
import { jwtDecode } from 'jwt-decode';

export interface UserPermissionsResponse {
  data: string[];
  success: boolean;
  message: string | null;
}

class PermissionsService {
  async getUserPermissions(): Promise<string[]> {
    try {
      const response = await HttpClient.get<any>(
        '/api/identity/account/user/permissions'
      );
      
      const payload = response.data;
      
      // Navigate to the 'modules' array based on the API response shape.
      const modules = payload?.data?.modules || payload?.modules;
      
      if (modules && Array.isArray(modules)) {
        return this.flattenPermissions(modules);
      }
      
      // Fallback: If it's the old flat array format for some reason.
      if (payload?.success && Array.isArray(payload.data) && typeof payload.data[0] === 'string') {
        return this.mapPermissions(payload.data);
      }
      
      return [];
    } catch {
      return [];
    }
  }

  // Flattens the nested tree into a list of strings
  private flattenPermissions(modules: any[]): string[] {
    const keys: string[] = [];
    modules.forEach((module) => {
      module.screens?.forEach((screen: any) => {
        screen.permissions?.forEach((perm: any) => {
          if (perm.permissionKey) {
            keys.push(perm.permissionKey);
          }
        });
      });
    });
    return this.mapPermissions(keys);
  }

  // Ensures compatibility by saving both formats (donation:campaign:view AND Donation.Campaign.View)
  private mapPermissions(keys: string[]): string[] {
    const mapped: string[] = [];
    keys.forEach(key => {
      mapped.push(key);
      
      // If it's colon:kebab-case, convert to Dot.PascalCase just in case other parts of the app expect it.
      if (key.includes(':')) {
        const legacyFormat = key
            .split(':')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase()))
            .join('.');
        mapped.push(legacyFormat);
      } else if (key.includes('.')) {
        // If it's Dot.PascalCase, generate colon:kebab-case mappings.
        mapped.push(key.toLowerCase().split('.').join(':'));
      }
    });
    // Remove duplicates
    return Array.from(new Set(mapped));
  }
}

// ─── localStorage helpers ────────────────────────────────────────────────────

export const storePermissions = (permissions: string[]): void => {
  localStorage.setItem('userPermissions', JSON.stringify(permissions));
};

export const getStoredPermissions = (): string[] => {
  try {
    const raw = localStorage.getItem('userPermissions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Returns true if the current user is the main (owner) Organizer.
 * Identified by the system-assigned "Organizer" role in the JWT.
 * Sub-users receive custom role names through the RBAC system — they never
 * carry the system role "Organizer" unless an organizer deliberately names a
 * custom role "Organizer", which the backend should prevent.
 */
export const isMainOrganizer = (): boolean => {
  try {
    const token = localStorage.getItem('AuthToken');
    if (!token) return false;
    const decoded = jwtDecode(token) as Record<string, any>;
    const roleKey = Object.keys(decoded).find(k => k.toLowerCase().includes('role'));
    if (!roleKey) return false;
    const roles: string[] = Array.isArray(decoded[roleKey]) ? decoded[roleKey] : [decoded[roleKey]];
    const hasOrganizer = roles.some(r => r.toLowerCase() === 'organizer');
    
    // DEBUG LOG
    // console.log('[DEBUG] isMainOrganizer Roles:', roles, '->', hasOrganizer);
    
    return hasOrganizer;
  } catch {
    return false;
  }
};

/**
 * Returns true if the current user is the real platform Admin.
 * Requires userId === organizerId in the JWT (owner identity) AND the JWT
 * must contain the system-assigned 'Admin' role — so that an organizer-created
 * sub-user whose custom role happens to be named 'Admin' is NOT granted access.
 */
export const isRealAdmin = (): boolean => {
  try {
    const token = localStorage.getItem('AuthToken');
    if (!token) return false;
    const decoded = jwtDecode(token) as Record<string, any>;
    if (String(decoded.userId) !== String(decoded.organizerId)) return false;
    const roleKey = Object.keys(decoded).find(k => k.toLowerCase().includes('role'));
    if (!roleKey) return false;
    const roles: string[] = Array.isArray(decoded[roleKey]) ? decoded[roleKey] : [decoded[roleKey]];
    return roles.some(r => r.toLowerCase() === 'admin');
  } catch {
    return false;
  }
};

/** Returns true if the stored permissions include the given key */
export const hasPermission = (permission: string): boolean => {
  if (isMainOrganizer()) return true;
  return getStoredPermissions().includes(permission);
};

/** Returns true if the stored permissions include ANY of the given keys */
export const hasAnyPermission = (...permissions: string[]): boolean => {
  if (isMainOrganizer()) return true;
  const stored = getStoredPermissions();
  return permissions.some(p => stored.includes(p));
};

/**
 * Returns the first organizer path the user has permission to access.
 * Mirrors sidebar order: Dashboard → Campaigns → Payments → Donors →
 * Recurring Donations → Archived List → Profile Settings (always accessible).
 */
export const getFirstAvailableOrganizerPath = (): string => {
  if (isMainOrganizer()) return '/organizer/organizer-dashboard';

  const perms = getStoredPermissions();
  const has = (p: string) => perms.includes(p);

  if (has('Donation.Dashboard.View'))   return '/organizer/organizer-dashboard';
  if (has('Donation.Campaign.View'))    return '/organizer/donation/manage-donation-module';
  if (has('Donation.Invoice.View'))     return '/organizer/donation/list/paid';
  if (has('Donation.Donors.View'))      return '/organizer/donation/donor-list';
  if (has('Donation.Recurring.View'))   return '/organizer/donation/recurring-donations';
  if (has('Donation.Archived.View'))    return '/organizer/donation/archived-donors';

  // No accessible route found — show access denied
  return '/organizer/access-denied';
};

export default new PermissionsService();
