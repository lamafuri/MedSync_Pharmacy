import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('pharmacist-auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        // Ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = requestUrl.startsWith('/api/auth');

    if (error.response?.status === 401) {
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
      localStorage.removeItem('pharmacist-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
