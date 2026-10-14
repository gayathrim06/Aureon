// Aureon REST API Client Service
// Integrates React Frontend with Node/Express REST Backend API on port 5000

export const getApiBaseUrl = () => {
  const host = typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost'
    ? window.location.hostname 
    : '127.0.0.1';
  return `http://${host}:8000/api/v1`;
};

export const API_BASE_URL = getApiBaseUrl();

export const isRealJwt = (token) => {
  return Boolean(token && typeof token === 'string' && token.startsWith('ey') && token.split('.').length === 3);
};

export const getAuthToken = () => {
  const token = sessionStorage.getItem('aureon_jwt_access_token') || 
                localStorage.getItem('aureon_jwt_access_token') || 
                sessionStorage.getItem('aureon_access_token') || 
                localStorage.getItem('aureon_access_token');
  return isRealJwt(token) ? token : null;
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  try {
    const savedUser = sessionStorage.getItem('aureon_current_user') || localStorage.getItem('aureon_current_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u.id) headers['X-User-Id'] = String(u.id);
      if (u.email) headers['X-User-Email'] = String(u.email);
      if (u.role || u.role_name) headers['X-User-Role'] = String(u.role || u.role_name);
    }
  } catch (e) {}
  return headers;
};

export const apiClient = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
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
    const normalizedData = (data && typeof data === 'object') ? (
      data.data !== undefined ? data.data :
      data.projects !== undefined ? data.projects :
      data.tasks !== undefined ? data.tasks :
      data.sprints !== undefined ? data.sprints :
      data.teams !== undefined ? data.teams :
      data.bugs !== undefined ? data.bugs :
      data.users !== undefined ? data.users :
      data.roles !== undefined ? data.roles :
      data.commits !== undefined ? data.commits :
      data.pull_requests !== undefined ? data.pull_requests :
      data.reports !== undefined ? data.reports :
      data
    ) : data;

    if (!response.ok) {
      return { ok: false, success: false, status: response.status, data: normalizedData, raw: data };
    }
    return { ok: true, success: true, status: response.status, data: normalizedData, ...data };
  } catch (error) {
    console.warn(`[API CLIENT] Backend server offline or fallback mode: ${endpoint}`, error.message);
    return { ok: false, success: false, status: 500, error: 'BACKEND_OFFLINE', data: [] };
  }
};

apiClient.get = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'GET' });
apiClient.post = (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
apiClient.patch = (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
apiClient.put = (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
apiClient.delete = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'DELETE' });

export const refreshJwtToken = async () => {
  const refreshToken = sessionStorage.getItem('aureon_jwt_refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem('aureon_jwt_access_token', data.accessToken);
      sessionStorage.setItem('aureon_jwt_refresh_token', data.refreshToken);
      return true;
    }
  } catch (e) {
    console.error('[API CLIENT] Token refresh failed:', e);
  }
  return false;
};
