import axios from "axios";

const HttpClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true  // Add this line
});

// Track if a refresh is in progress to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

/**
 * What a caller may show a user when the session cannot be renewed. The conditions behind it - no
 * stored refresh token, a response the endpoint shaped unexpectedly - are internal, and extractApiError
 * surfaces the message of any non-Axios Error straight to the screen, so the message itself has to be
 * the sentence a person should read rather than the reason a developer would want.
 */
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

// Function to handle logout
const handleLogout = () => {
    localStorage.removeItem('AuthToken');
    localStorage.removeItem('RefreshToken');
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/auth/sign-in/custom';
};

// Function to refresh token
const refreshAuthToken = async (): Promise<string> => {
    const refreshToken = localStorage.getItem('RefreshToken');

    console.log('[Token Refresh] Starting refresh process...');
    console.log('[Token Refresh] Refresh token exists:', !!refreshToken);

    if (!refreshToken || refreshToken === 'undefined' || refreshToken === '') {
        console.warn('[Token Refresh] No valid refresh token — skipping refresh, session may expire naturally.');
        // Don't log out — the current AuthToken may still be valid.
        // Let the 401 propagate so the caller can decide what to do.
        throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    const formData = new FormData();
    formData.append('refreshToken', refreshToken);

    try {
        console.log('[Token Refresh] Calling refresh endpoint...');
        const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/identity/account/refresh-token`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        );

        console.log('[Token Refresh] Response received:', response.status);

        // Log full response so we can verify the token field name
        const rawData = response.data;
        console.log('[Token Refresh] Raw response data:', JSON.stringify(rawData));

        // Handle nested data structure from API response
        const responseData = rawData?.data || rawData;

        const newAccessToken =
            responseData?.accessToken ||
            responseData?.token ||
            responseData?.access_token ||
            responseData?.jwtToken;

        if (newAccessToken) {
            console.log('[Token Refresh] New tokens received, updating storage');
            localStorage.setItem('AuthToken', newAccessToken);
            const newRefreshToken =
                responseData?.refreshToken ||
                responseData?.refresh_token;
            if (newRefreshToken) {
                localStorage.setItem('RefreshToken', newRefreshToken);
            }
            console.log('[Token Refresh] Success! Token refreshed');
            return newAccessToken;
        }

        console.error('[Token Refresh] Could not find access token in response. Keys found:', Object.keys(responseData || {}));
        throw new Error(SESSION_EXPIRED_MESSAGE);
    } catch (error) {
        console.error('[Token Refresh] Failed:', error);
        if (axios.isAxiosError(error)) {
            // A real API error from the refresh endpoint — session is invalid, force logout
            const status = error.response?.status;
            console.error('[Token Refresh] API Error:', status, error.response?.data);
            console.error('[Token Refresh] Request details:', {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            });
            if (status === 401) {
                console.error('[Token Refresh] Refresh token expired or invalid. Logging out.');
            }
            handleLogout();
        } else {
            // Local error (e.g. no refresh token stored) — don't force logout,
            // the access token may still be valid for future requests.
            console.warn('[Token Refresh] Non-API error, skipping logout:', (error as Error).message);
        }
        throw error;
    }
};

// Helper function to check if URL is a public/auth endpoint (no token needed)
const isPublicEndpoint = (url?: string): boolean => {
    if (!url) {
        return false;
    }

    // External OAuth login endpoints — never need an AuthToken attached
    if (url.includes('/api/identity/account/authenticate/external-login/')) {
        return true;
    }

    // Public organizer endpoints (e.g. external-signup)
    if (url.includes('/api/organizer/public/')) {
        return true;
    }

    // Block all campaign management endpoints - these ALWAYS require authentication
    if (url.includes('/api/donation/campaign/')) {
        return false;
    }

    // Allow /api/donation/{campaignId}/donate endpoint to be public
    if (url.includes('/api/donation/') && url.includes('/donate')) {
        return true;
    }

    // Public membership registration endpoint
    if (url.includes('/api/membership/') && url.includes('/register')) {
        return true;
    }

    // Public membership invoice view endpoint (used by the emailed invoice link)
    if (url.includes('/api/invoice/membership/') && url.includes('/view')) {
        return true;
    }

    return false;
};

// Request interceptor - only add token, don't refresh here
HttpClient.interceptors.request.use(
    (config) => {
        // Skip adding auth token for public endpoints
        if (isPublicEndpoint(config.url)) {
            return config;
        }

        const token = localStorage.getItem('AuthToken');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401 and refresh token
HttpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;

        // Skip auth handling for public endpoints - just reject the error
        if (isPublicEndpoint(originalRequest?.url)) {
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized - but only if we haven't already retried
        if (status === 401 && !originalRequest._retry) {
            console.log('[401 Handler] Received 401, attempting token refresh...');

            if (isRefreshing) {
                console.log('[401 Handler] Already refreshing, queuing request...');
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        console.log('[401 Handler] Retrying queued request with new token');
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return HttpClient(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshAuthToken();
                processQueue(null, newToken);

                console.log('[401 Handler] Retrying original request with new token');
                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return HttpClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // refreshAuthToken() already logs out internally when the refresh
                // endpoint confirms the session is invalid (axios error). When it
                // fails locally instead (e.g. no refresh token stored), it deliberately
                // avoids logging out since the current AuthToken may still be valid —
                // don't override that decision by forcing a logout here too.
                if (axios.isAxiosError(refreshError)) {
                    console.error('[401 Handler] Refresh failed with an API error, session invalid.');
                } else {
                    console.warn('[401 Handler] Refresh failed locally, leaving session as-is:', (refreshError as Error).message);
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // If _retry is true it means the refresh succeeded but the API
        // still returned 401 — this is a permission issue, not a session issue.
        // Do NOT logout; just reject so the caller can handle it (e.g. show a message).
        if (status === 403) {
            // Forbidden — also a permission issue, never logout
            console.warn('[Auth] 403 Forbidden — insufficient permissions for:', originalRequest?.url);
        }

        return Promise.reject(error);
    }
);

export default HttpClient;
