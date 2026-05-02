import axios from 'axios';

/**
 * Base URL: Vite dev server proxies /api → backend.
 * VITE_API_URL: use full origin; "/api" is appended if missing (common mistake: port only).
 */
function resolveApiBase() {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return '/api';
  const base = raw.replace(/\/$/, '');
  if (base.endsWith('/api')) return base;
  return `${base}/api`;
}

const baseURL = resolveApiBase();

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
