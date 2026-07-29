/**
 * Mission Types
 * Types for mission data and API responses
 */

export enum MissionTypes {
  NORMAL,
  GRID,
}

export enum WaypointCommands {
  FINISH = 'FINISH',
  RTH = 'RTH',
  HOVER = 'HOVER',
  LAND = 'LAND',
}

export enum PayloadEnum {
  RGB = 'RGB',
  THERMAL = 'THERMAL',
  MULTI = 'MULTI',
}

export interface WaypointFE {
  _id: string;
  lat: number;
  lng: number;
  alt: number;
  heading?: number;
  speed?: number;
  curveSize?: number;
  gimbalPitch?: number;
  actionTimeout?: number;
  actionType?: number;
  actionParam?: number;
  waypointCmdType?: number;
  waypointCmdParam?: number;
  cornerRadius?: number;
  dampingDistance?: number;
}

export interface GridLayoutBE {
  frontEdgePoints: WaypointFE[];
  backEdgePoints: WaypointFE[];
  gridDetails: {
    rotation: number;
    direction: number;
    rows: number;
    spacing: number;
  };
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

/**
 * Mission API Response Interface
 *
 * Represents the structure of mission data returned by the API
 */
export interface MissionBESimple {
  _id: string;
  user_id: string;
  name: string;
  alt: number;
  radius: number;
  speed: number;
  startSpeed?: number;
  type: MissionTypes;
  simpleWaypoints: WaypointFE[];
  gridLayout?: GridLayoutBE;
  missionLength: number;
  noOfWaypoints: number;
  finishAction: WaypointCommands;
  isDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  isImported: boolean;
  tagIds?: string[];
  tags: Tag[];
  isDisabled?: boolean;
  isImportedFromWpml?: boolean;
  recordedMissionType?: number;
  wpmlS3Link?: string;
  wpmlMd5?: string;
  altType?: number;
  takeOffAlt: number;
  takeOffType?: number;
  routeWaypointTurnType?: number;
  droneYawType?: number;
  gimbalControlType?: number;
  payloadSettings?: number[];
  site_ids?: string[];
  sites?: any[];
  payload?: PayloadEnum;
  imageFrontOverlap?: number;
  imageSideOverlap?: number;
  approachAltitude?: number;
  isCustomApproach: boolean;
  custom_waypoints: any;
  rcLinkLossAction?: number;
  waylinePrecisionType?: number;
}

/**
 * Mission API Response
 *
 * Array of mission data
 */
export type MissionsResponse = MissionBESimple[];
