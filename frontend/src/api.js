// Central API utility
// In production, VITE_API_URL points to the Render backend.
// In development, it's empty so relative paths work with Vite's proxy.
const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiFetch = (path, options = {}) => {
  return fetch(`${API_BASE}${path}`, options);
};
