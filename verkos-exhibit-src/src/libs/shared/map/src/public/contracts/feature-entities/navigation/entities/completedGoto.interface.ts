import { IPosition } from '@map/public/contracts/base';

export interface ICompletedGoto {
  readonly id: string;
  setVisibility(visible: boolean): void;
  panTo(): void;
  remove(): void;
}

export interface ICompletedGotoOptions {
  position: IPosition;
}
