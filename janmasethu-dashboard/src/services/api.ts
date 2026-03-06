import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json"
  }
});

// Add a request interceptor to inject auth headers
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        config.headers['x-user-id'] = user.email;
        config.headers['x-user-role'] = user.role;
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }
  return config;
});

export default api;
