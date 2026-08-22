import { jwtDecode } from 'jwt-decode';
import { redirectAfterLogin } from 'utils/roleRedirect';
import permissionsService, {
  storePermissions,
} from 'app/service/organizer/rolesPermissions/permissionsService';

/**
 * Establishing a session after the server has accepted a credential.
 *
 * This lives apart from the sign-in screen so that every surface offering a sign-in establishes the
 * session the same way. A second surface with its own copy would be a second place for two-factor
 * verification, role bucketing or permission loading to be forgotten, and the account whose sign-in
 * silently skipped two-factor is exactly the account that needed it.
 */

interface OrganizerDetail {
  organizerUniqueId?: string;
  organizerId?: string | number;
  name?: string;
}

interface UserDetail {
  memberUniqueId?: string;
  roles?: string[];
  userId?: string | number;
  email?: string;
  name?: string;
  refreshToken?: string;
}

export interface LoginPayload {
  accessToken?: string;
  refreshToken?: string;
  organizerId?: string | number;
  userId?: string | number;
  userEmail?: string;
  userName?: string;
  userOrg?: string;
  roleValue?: string;
  isUserDefined?: boolean;
  organizerDetail?: OrganizerDetail;
  userDetail?: UserDetail;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  data?: LoginPayload;
}

/** How long the confirmation stays on screen before the redirect takes over. */
const REDIRECT_DELAY_MS = 1500;

const asRoleList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value as string[];
  }

  if (typeof value === 'string') {
    return value.includes(',') ? value.split(',').map((entry) => entry.trim()) : [value];
  }

  return [];
};

/**
 * The dashboard this account belongs on. Member and Participant overlap as roles, so the modules
 * claim decides between them; Admin and Organizer stay role-based.
 */
const resolveCurrentRole = (
  decoded: Record<string, unknown>,
  data: LoginPayload,
  userRole: string | string[],
): string => {
  // A real admin owns the account and carries the system role. A sub-user whose custom role happens
  // to be named "Admin" has a different user id and belongs on the organizer dashboard.
  const isOwner = String(decoded.userId) === String(decoded.organizerId);
  const rolesFromToken = Array.isArray(userRole) ? userRole : [String(userRole)];
  const allRoles = [...rolesFromToken, ...(data.userDetail?.roles ?? [])].map((role) =>
    role.toLowerCase(),
  );

  const modules = asRoleList(decoded.userAllowedModules ?? decoded.allowedModules).map((module) =>
    module.toLowerCase(),
  );

  if (isOwner && allRoles.includes('admin')) {
    return 'Admin';
  }

  // A sub-user created by an organizer lands on the organizer dashboard; what they can actually
  // reach is governed by the permissions fetched below, not by this coarse bucket.
  if (data.isUserDefined || allRoles.includes('organizer')) {
    return 'Organizer';
  }

  if (modules.includes('membership')) {
    return 'Member';
  }

  if (modules.includes('donation')) {
    return 'Donor';
  }

  if (allRoles.some((role) => role === 'donor' || role === 'participant')) {
    return 'Donor';
  }

  return allRoles.some((role) => role === 'member') ? 'Member' : 'Organizer';
};

const storeSession = (
  data: LoginPayload,
  decoded: Record<string, unknown>,
  provider: string,
): void => {
  // Values are written exactly as the server sent them. Several screens read these keys back and
  // treat the literal text "undefined" as a present value; normalising it here would change what
  // those screens decide, which is a separate change from moving this code.
  localStorage.setItem('AuthToken', data.accessToken as string);
  localStorage.setItem('loginProvider', provider);
  localStorage.setItem('organizerId', data.organizerId as string);

  if (data.organizerDetail?.organizerUniqueId) {
    localStorage.setItem('organizerUniqueId', data.organizerDetail.organizerUniqueId);
  }

  localStorage.setItem('userEmail', data.userEmail as string);
  localStorage.setItem('userId', data.userId as string);
  localStorage.setItem('userName', data.userName as string);
  localStorage.setItem('userOrg', data.userOrg as string);
  localStorage.setItem('RefreshToken', data.refreshToken as string);

  const memberUniqueId =
    data.userDetail?.memberUniqueId || (decoded.memberUniqueId as string) || '';

  if (memberUniqueId) {
    localStorage.setItem('memberUniqueId', memberUniqueId);
  }
};

/**
 * Stores the session, loads the account's permissions and sends the person on. A return path is
 * honoured only after the caller has already validated it.
 */
export function completeLogin(
  response: LoginResponse,
  provider: string = 'ideali',
  returnPath: string | null = null,
): void {
  const data = response.data;

  if (!data?.accessToken) {
    return;
  }

  const decoded = jwtDecode(data.accessToken) as Record<string, unknown>;

  storeSession(data, decoded, provider);

  const roleKey = Object.keys(decoded).find((key) => key.toLowerCase().includes('role'));
  const userRole = (roleKey ? decoded[roleKey] : undefined) || data.roleValue || 'user';
  const currentRole = resolveCurrentRole(decoded, data, userRole as string | string[]);

  localStorage.setItem('userRole', String(userRole));
  localStorage.setItem('currentRole', currentRole);

  permissionsService
    .getUserPermissions()
    .then((permissions) => storePermissions(permissions))
    .catch(() => storePermissions([]))
    .finally(() => {
      setTimeout(() => {
        redirectAfterLogin(
          currentRole,
          data.userId as string,
          data.organizerId as string,
          returnPath as string,
        );
      }, REDIRECT_DELAY_MS);
    });
}

/**
 * The two-factor endpoint answers with details nested under userDetail and organizerDetail. Flatten
 * them onto the shape a completed login expects, rather than teaching that code two shapes.
 */
export function completeTwoFactorLogin(
  response: LoginResponse,
  returnPath: string | null = null,
): void {
  const data = response.data;

  if (!data) {
    return;
  }

  completeLogin(
    {
      ...response,
      data: {
        ...data,
        userId: data.userDetail?.userId,
        organizerId: data.organizerDetail?.organizerId,
        userEmail: data.userDetail?.email,
        userName: data.userDetail?.name,
        userOrg: data.organizerDetail?.name,
        roleValue: data.userDetail?.roles?.[0],
      },
    },
    'ideali',
    returnPath,
  );
}
