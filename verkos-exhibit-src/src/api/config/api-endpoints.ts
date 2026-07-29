/**
 * API endpoints configuration
 * Centralizes all API endpoint paths for easier management and consistency
 *
 * Add your application-specific endpoints here as you build features.
 * See integrations/api-integration.md for detailed guidance.
 */

export const API_ENDPOINTS = {
  SITE: {
    /**
     * Get a list of all sites
     * Used by auth guards in _layout.tsx to verify user has site access
     */
    LIST: 'sites/',
  },
  // Add more endpoints as your application grows
  // Example:
  // FEATURE: {
  //   LIST: 'v3/feature/list',
  //   GET: (id: string) => `v3/feature/${id}`,
  //   CREATE: 'v3/feature/create',
  //   UPDATE: (id: string) => `v3/feature/${id}`,
  //   DELETE: (id: string) => `v3/feature/${id}`,
  // },
};

export default API_ENDPOINTS;
