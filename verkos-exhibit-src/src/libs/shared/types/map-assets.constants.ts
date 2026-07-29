export enum SourceTypes {
  RASTER_IMAGERY = 'RASTER_IMAGERY',
  RASTER_TERRAIN = 'RASTER_TERRAIN',
  TERRAIN_DATABASE = 'TERRAIN_DATABASE',
  TILES = '3DTILES',
  POINT_CLOUD = 'POINT_CLOUD',
}

export const SourceTypeMapping = {
  [SourceTypes.RASTER_IMAGERY]: 'RASTER_IMAGERY',
  [SourceTypes.RASTER_TERRAIN]: 'RASTER_IMAGERY',
  [SourceTypes.TERRAIN_DATABASE]: 'TERRAIN_DATABASE',
  [SourceTypes.TILES]: '3DTILES',
  [SourceTypes.POINT_CLOUD]: 'POINT_CLOUD',
};

export enum AssetTypes {
  TERRAIN = 'TERRAIN',
  IMAGERY = 'IMAGERY',
  TILES = '3DTILES',
}

export const TypeMapping = {
  [SourceTypes.RASTER_IMAGERY]: AssetTypes.IMAGERY,
  [SourceTypes.RASTER_TERRAIN]: AssetTypes.TERRAIN,
  [SourceTypes.TERRAIN_DATABASE]: AssetTypes.TERRAIN,
  [SourceTypes.TILES]: AssetTypes.TILES,
  [SourceTypes.POINT_CLOUD]: AssetTypes.TILES,
};

export enum Status {
  PENDING = 'PENDING',
  CONVERSION_IN_PROGRESS = 'CONVERSION_IN_PROGRESS',
  CONVERSION_COMPLETED = 'CONVERSION_COMPLETED',
  CONVERSION_ERROR = 'CONVERSION_ERROR',
  EXPORT_IN_PROGRESS = 'EXPORT_IN_PROGRESS',
  EXPORT_COMPLETE = 'EXPORT_COMPLETE',
  EXPORT_ERROR = 'EXPORT_ERROR',
}

export const FinalAssetStates = [
  Status.EXPORT_COMPLETE,
  Status.EXPORT_ERROR,
  Status.CONVERSION_ERROR,
];

export enum API_RESPONSE {
  NOT_STARTED = 'NOT_STARTED',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  DATA_ERROR = 'DATA_ERROR',
}

export enum AssetType {
  ASSET_2D,
  ASSET_3D,
}

export enum StorageTypes {
  S3 = 'S3',
}

export const cesiumBaseUrl = 'https://api.cesium.com/v1/assets/';
export const BaseTerrainId = 1; // Cesium World Terrain
