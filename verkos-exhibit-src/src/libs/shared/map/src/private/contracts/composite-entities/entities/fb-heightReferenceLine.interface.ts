import { IPosition } from '@map/public/contracts';
import { IFBEntity } from './fb-entity.interface';

export interface IFbHeightReferenceLine extends IFBEntity {
  setVisibility(visible: boolean): void;
  updatePosition(position: IPosition): void;
}
