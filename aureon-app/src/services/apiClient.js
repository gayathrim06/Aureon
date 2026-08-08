// Aureon REST API Client Service
// Integrates React Frontend with Node/Express REST Backend API on port 5000

const API_BASE_URL = 'http://localhost:5000/api/v1';

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('aureon_jwt_access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Handle HTTP 401 & Token Rotation
    if (response.status === 401 && !options._retry) {
      const refreshed = await refreshJwtToken();
      if (refreshed) {
        options._retry = true;
        return apiClient(endpoint, options);
      }
    }

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, status: response.status, data };
    }
    return { ok: true, status: response.status, data };
  } catch (error) {
    console.warn(`[API CLIENT] Backend server offline or fallback mode: ${endpoint}`, error.message);
    return { ok: false, status: 500, error: 'BACKEND_OFFLINE' };
  }
};

export const refreshJwtToken = async () => {
  const refreshToken = localStorage.getItem('aureon_jwt_refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('aureon_jwt_access_token', data.accessToken);
      localStorage.setItem('aureon_jwt_refresh_token', data.refreshToken);
      return true;
    }
  } catch (e) {
    console.error('[API CLIENT] Token refresh failed:', e);
  }
  return false;
};
