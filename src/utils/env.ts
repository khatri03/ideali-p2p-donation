const readOptional = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const GOOGLE_CLIENT_ID = readOptional(import.meta.env.VITE_GOOGLE_CLIENT_ID);

/**
 * Google sign-in is optional per environment. When the client ID is absent the
 * provider still mounts — its hooks throw outside a provider and would take the
 * whole tree down — but every Google entry point stays hidden.
 */
export const isGoogleAuthEnabled = GOOGLE_CLIENT_ID !== undefined;
