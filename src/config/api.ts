import axios from 'axios';

// Base API URL pointing to backend (strips trailing slash automatically)
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://megaecomm.megascale.co.in/backend').replace(/\/+$/, '');
export const API_ROOT_URL = `${API_BASE_URL}/api`;
export const API_SHOP_URL = `${API_BASE_URL}/api/shop`;
export const SHOP_DOMAIN = import.meta.env.VITE_SHOP_DOMAIN || 'annapurna-khakhra.myshopify.com';
export const SHOPFRONT_TOKEN = import.meta.env.VITE_SHOPFRONT_TOKEN || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Shopfront-Token': SHOPFRONT_TOKEN,
  },
  timeout: 20000,
});

// Interceptor for JWT auth token and cart token
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('userToken') ||
    localStorage.getItem('annapurna_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('accessToken');

  const cartToken =
    localStorage.getItem('annapurna_cart_id') ||
    localStorage.getItem('cart_token');

  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  if (cartToken) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('X-Cart-Token', cartToken);
    } else {
      config.headers = config.headers || {};
      config.headers['X-Cart-Token'] = cartToken;
    }
  }

  return config;
});


