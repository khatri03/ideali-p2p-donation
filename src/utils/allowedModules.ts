import { jwtDecode } from 'jwt-decode';

/**
 * Reads the modules a member/donor is allowed to use from the JWT.
 * The claim may be 'userAllowedModules' (member/donor logins) or the
 * legacy 'allowedModules' (organizer-shaped tokens), as an array or a
 * comma-separated string.
 */
export const getAllowedModules = (): string[] => {
  try {
    const token = localStorage.getItem('AuthToken');
    if (!token) return [];
    const decoded = jwtDecode(token) as Record<string, any>;
    const modules = decoded.userAllowedModules ?? decoded.allowedModules;
    if (!modules) return [];
    if (Array.isArray(modules)) return modules;
    if (typeof modules === 'string') {
      return modules.includes(',') ? modules.split(',').map((m: string) => m.trim()) : [modules];
    }
    return [];
  } catch {
    return [];
  }
};

export const hasAllowedModule = (name: string): boolean =>
  getAllowedModules().some((m) => m.toLowerCase() === name.toLowerCase());
