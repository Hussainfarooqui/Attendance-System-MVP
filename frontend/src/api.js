// Central API configuration — imported first by main.jsx
import axios from 'axios';

// Single source of truth for the backend URL
// Do NOT set a global Content-Type — each request type sets its own
axios.defaults.baseURL = 'http://localhost:8000';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
