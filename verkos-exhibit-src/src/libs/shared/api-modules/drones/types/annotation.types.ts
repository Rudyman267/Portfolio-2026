// Common coordinate interface
export interface Coordinate {
  lat: number;
  lng: number;
  alt?: number;
  id: string;
}

// User who updated the annotation
export interface AnnotationUser {
  id: string;
  email: string;
  name: string;
}

// Custom icon interface
export interface CustomIcon {
  _id: string;
  name: string;
  svg_content: string;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

// Base annotation interface with common properties
export interface AnnotationBase {
  _id: string;
  type: 'annotation-point' | 'annotation-line' | 'annotation-polygon';
  description: string;
  updated_by: AnnotationUser;
  color: string;
  updated_at: string;
  name: string;
  icon_type: 'custom' | 'default';
  default_icon_id: string;
  custom_icon_id: string;
  custom_icon: CustomIcon;
  group_id: string;
  source: string;
}

// Point annotation (single coordinate)
export interface PointAnnotation extends AnnotationBase {
  type: 'annotation-point';
  coordinates: [Coordinate]; // Always has exactly one coordinate
}

// Line annotation (multiple coordinates forming a line)
export interface LineAnnotation extends AnnotationBase {
  type: 'annotation-line';
  coordinates: Coordinate[]; // Multiple coordinates forming a line
}

// Polygon annotation (multiple coordinates forming a closed shape)
export interface PolygonAnnotation extends AnnotationBase {
  type: 'annotation-polygon';
  coordinates: Coordinate[]; // Multiple coordinates forming a closed polygon
}

// Union type for all annotation types
export type Annotation = PointAnnotation | LineAnnotation | PolygonAnnotation;

// Response type for API endpoints returning multiple annotations
export interface AnnotationsResponse {
  annotations: Annotation[];
}
