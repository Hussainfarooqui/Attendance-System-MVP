// Central API configuration — imported first by main.jsx
import axios from 'axios';

// Single source of truth for the backend URL
// Do NOT set a global Content-Type — each request type sets its own
axios.defaults.baseURL = 'http://localhost:8005';

export default axios;
