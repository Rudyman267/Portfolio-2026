/**
 * Zone Types
 */

import { ZoneType } from '@libs/shared/enums';

export enum ZoneGeometryType {
  POLYGON = 'Polygon',
  CIRCLE = 'Point',
}

// Polygon coordinate interface
export interface ZoneCoordinate {
  _id: string;
  lat: number;
  lng: number;
  min_alt: number;
  max_alt: number;
}

// Polygon geometry interface
export interface ZonePolygon {
  _id: string;
  cords: ZoneCoordinate[];
  min_alt: number;
  max_alt: number;
  area: number;
  perimeter: number;
}

// Circle geometry interface
export interface ZoneCircle {
  _id: string;
  lat: number;
  lng: number;
  min_alt: number;
  max_alt: number;
  radius: number;
  area: number;
  perimeter: number;
}

// Zone interface for both polygon and circle zones
export interface Zone {
  _id: string;
  is_delete: boolean;
  zone_type: ZoneType;
  org_id: string;
  created_by: string;
  updated_by: string;
  updated_by_username: string;
  name: string;
  enabled: boolean;
  geometry_type: ZoneGeometryType;
  polygon?: ZonePolygon;
  circle?: ZoneCircle;
  tag_ids: string[];
  created_at: string;
  updated_at: string;
  __v: number;
}

// Drone zone sync status
export interface DroneZone {
  _id: string;
  is_delete: boolean;
  drone_id: string;
  geofence_binded: Zone[] | null;
  geofence_compatible: Zone[] | null;
  last_sync_zones: Zone[];
  failed_sync_zones: Zone[];
  current_sync_status: number;
  updated_at: string;
  created_at: string;
  __v: number;
}

// Organization zones response
export type OrgZonesResponse = DroneZone[];
export type DeviceZonesResponse = DroneZone;
