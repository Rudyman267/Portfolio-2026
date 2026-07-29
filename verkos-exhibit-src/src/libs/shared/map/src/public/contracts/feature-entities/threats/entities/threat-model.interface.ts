import { IPosition } from '@map/public/contracts/base';

export interface IThreatModelLabelStyle {
  fillColor?: string;
  scale?: number;

  showBackground?: boolean;
  backgroundColor?: string;
  backgroundAlpha?: number;
}

export interface IThreatModelModelAttitude {
  /**
   * Heading/yaw in degrees (0-360)
   */
  yaw?: number;

  /**
   * Pitch in degrees (-90 to 90)
   */
  pitch?: number;

  /**
   * Roll in degrees (-180 to 180)
   */
  roll?: number;
}

export interface IThreatModel {
  readonly id: string;
  readonly position: IPosition;

  setVisibility(visible: boolean): void;
  remove(): void;
  panTo(): void;
  updatePosition(position: IPosition): void;
  updateProperties(properties: { attitude?: IThreatModelModelAttitude }): void;
  updateLabelText(text: string): void;
  updateLabelStyle(style: IThreatModelLabelStyle): void;
  updateScale(scale: number): void;

  setIntruder(): void;
  setActiveThreat(): void;
}

export interface IThreadModelOptions {
  position: IPosition;
  labelText: string;
  id?: string;
  scale?: number;
}
