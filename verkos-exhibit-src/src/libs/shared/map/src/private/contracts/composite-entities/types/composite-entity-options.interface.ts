import { IPosition } from '@map/public/contracts';
import {
  CircleStyle,
  LabelStyle,
  MarkerStyle,
  ModelAttitude,
  ModelStyle,
  PolygonStyle,
  PolylineStyle,
} from '@map/private/contracts/core';
import { HeightReferenceEnum } from '@map/public/core';

export interface IFBPolylineOptions {
  id?: string;
  positions: IPosition[];
  style?: PolylineStyle;
  editable?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
  visible?: boolean;
  labelText?: string;
  labelStyle?: LabelStyle;
  showDistanceLabels?: boolean;
  enableDistanceDisplay?: boolean;
}

export interface IFBPolygonOptions {
  id?: string;
  positions: IPosition[];
  style?: PolygonStyle;
  editable?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
  visible?: boolean;
  labelText?: string;
  labelStyle?: LabelStyle;
  showDistanceLabels?: boolean;
}

export interface IFBPolygonFromCenterOptions {
  id?: string;
  position: IPosition;
  radius: number;
  style?: PolygonStyle;
  editable?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
  visible?: boolean;
  labelText?: string;
  labelStyle?: LabelStyle;
  showDistanceLabels?: boolean;
}

export interface IFBCircleOptions {
  id?: string;
  position: IPosition;
  radius: number;
  style?: CircleStyle;
  editable?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
  visible?: boolean;
  labelText?: string;
  labelStyle?: LabelStyle;
  showDistanceLabels?: boolean;
}

export interface IFBMarkerOptions {
  id?: string;
  position: IPosition;
  style?: MarkerStyle;
  editable?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
  visible?: boolean;
  labelText?: string;
  labelStyle?: LabelStyle;
  showHeightReference?: boolean;
  /**
   * Whether the underlying base marker should be keyboard controllable.
   * When enabled, marker can receive keyboard focus and respond to WASD/ZC keys.
   */
  isKeyboardControllable?: boolean;
}

export interface IFBModelOptions {
  id?: string;
  scale?: number;
  position: IPosition;
  style?: ModelStyle;
  attitude?: ModelAttitude;
  hoverable?: boolean;
  clickable?: boolean;
  editable?: boolean;
  visible?: boolean;
  labelText?: string;
  labelStyle?: LabelStyle;
  showHeightReference?: boolean;
  /**
   * Whether the underlying base model should be keyboard controllable.
   * When enabled, model can receive keyboard focus and respond to WASD/ZC/QE keys.
   */
  isKeyboardControllable?: boolean;
}

export interface HeightReferenceLineOptions {
  id?: string;
  position: IPosition;
  color?: string;
  width?: number;
  visible?: boolean;
  heightReference?: HeightReferenceEnum;
}
