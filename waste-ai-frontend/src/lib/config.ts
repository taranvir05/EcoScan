/**
 * Central configuration for the EcoScan frontend.
 *
 * All backend URLs are derived from VITE_API_URL so that a single
 * environment variable controls where the frontend points — locally
 * (http://localhost:5000) or in production (https://api.yourdomain.com).
 *
 * Set VITE_API_URL in waste-ai-frontend/.env (local) or in your
 * hosting platform's environment settings (production).
 */

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

/** Axios / fetch base for all /api/* calls */
export const API_URL = `${API_BASE_URL}/api`

/**
 * Builds an absolute URL for a server-hosted file (e.g. uploaded images
 * stored in the backend's uploads/ folder).
 */
export const buildFileUrl = (path?: string): string => {
  if (!path) return ''
  return `${API_BASE_URL}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`
}
