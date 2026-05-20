import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('pharmacist-auth');
    if (authData) {
      const { token } = JSON.parse(authData);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status === 401) {
      localStorage.removeItem('pharmacist-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
