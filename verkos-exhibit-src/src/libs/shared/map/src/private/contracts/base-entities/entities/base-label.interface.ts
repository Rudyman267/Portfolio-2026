import { IPosition } from '@map/public/contracts';
import { IBaseEntity } from './base-entity.interface';
import { LabelStyle } from '@map/private/contracts/core';

export interface ILabelConfig {
  /**
   * Optional unique identifier for the label
   */
  id?: string;
  position: IPosition;
  text: string;
  style?: LabelStyle;
  isEditable?: boolean;
}

export interface IBaseLabel extends IBaseEntity {
  // Readonly properties
  readonly text: string;
  readonly position: IPosition;
  readonly style: LabelStyle;
  readonly visible: boolean;

  // Text content
  setText(text: string): void;

  // Position management
  updatePosition(position: IPosition): void;

  // Styling methods
  updateProperties(style: Partial<LabelStyle>): void;

  // Visibility
  setVisibility(visible: boolean): void;

  // Cleanup
  destroy(): void;

  // Navigation
  panToEntity(): void;
}
