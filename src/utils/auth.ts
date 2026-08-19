export const getAuthToken = (): string | null => {
  return localStorage.getItem('AuthToken');
};

// export const decodeJwtPayload = (token: string): any | null => {
//   try {
//     const payload = token.split('.')[1];
//     const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
//     return JSON.parse(decoded);
//   } catch (e) {
//     return null;
//   }
// };

// export const isTokenExpired = (token: string): boolean => {
//   const payload = decodeJwtPayload(token);
//   if (!payload || !payload.exp) return true;
//   const nowSeconds = Math.floor(Date.now() / 1000);
//   return payload.exp <= nowSeconds;
// };

export const ensureAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  return !isTokenExpired(token);
};


export const decodeJwtPayload = (token: string): any | null => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

// Check if token is expired (with optional buffer in seconds)
export const isTokenExpired = (token: string, bufferSeconds: number = 30): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  // Add buffer time to refresh token before it actually expires
  return payload.exp <= (nowSeconds + bufferSeconds);
};

// Get token expiration time (optional helper)
export const getTokenExpiration = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  return payload?.exp || null;
};