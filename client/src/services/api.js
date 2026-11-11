const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('sweety_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error || data.message || 'Something went wrong';
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Readings
  getReadings: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.slot && params.slot !== 'All time slots') query.append('slot', params.slot);
    if (params.date_from) query.append('date_from', params.date_from);
    if (params.date_to) query.append('date_to', params.date_to);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/readings${queryString}`);
  },
  getReadingById: (id) => request(`/readings/${id}`),
  createReading: (payload) => request('/readings', { method: 'POST', body: JSON.stringify(payload) }),
  updateReading: (id, payload) => request(`/readings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteReading: (id) => request(`/readings/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (dateStr) => {
    const q = dateStr ? `?date=${dateStr}` : '';
    return request(`/reports${q}`);
  },
  getTrend: (dateStr) => {
    const q = dateStr ? `?date=${dateStr}` : '';
    return request(`/reports/trend${q}`);
  }
};
