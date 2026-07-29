/**
 * Sites API Types
 *
 * Type definitions for sites API following the established pattern
 * from user-profile API and matching ISite interface from asset-management
 */

export interface ISite {
  _id: string;
  name: string;
  organization_id: string;
  owner_id: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  coordinates: {
    lat: number;
    lng: number;
    _id: string;
  };
  members: string[];
  devices: any[]; // Can be more specific if device structure is known
  missions: Array<{
    _id: string;
    name: string;
  }>;
}

// Raw API response - sites are returned as a direct array
export type SitesResponse = ISite[];
