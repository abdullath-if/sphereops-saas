import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sphereops_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: standard unwrap & handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred.';

    if (error.response?.status === 401) {
      // If token expired or invalid, purge token if not already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('sphereops_token');
        localStorage.removeItem('sphereops_user');
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
