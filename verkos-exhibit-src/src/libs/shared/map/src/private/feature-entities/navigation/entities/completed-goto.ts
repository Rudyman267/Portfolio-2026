import { v4 } from 'uuid';
import { ICompletedGoto, ICompletedGotoOptions } from '@map/public/contracts';
import {
  ICompositeManager,
  IFBMarker,
  IFBMarkerOptions,
} from '@map/private/contracts';
import { DEFAULT_COMPLETED_GOTO_MARKER_STYLE } from '../constants';

export class CompletedGoto implements ICompletedGoto {
  private _completedGotoMarker: IFBMarker;
  public readonly _id: string;
  private _compositeManager: ICompositeManager;

  constructor(
    compositeManager: ICompositeManager,
    options: ICompletedGotoOptions
  ) {
    this._id = `completed-goto-marker-${v4()}`;
    this._compositeManager = compositeManager;

    this._completedGotoMarker = this.createCompletedGotoMarker(options);
  }

  get id(): string {
    return this._id;
  }

  setVisibility(visible: boolean): void {
    this._completedGotoMarker.setVisibility(visible);
  }

  panTo(): void {
    this._completedGotoMarker.panTo();
  }

  remove(): void {
    this._completedGotoMarker.remove();
  }

  // Private Methods
  private createCompletedGotoMarker(options: ICompletedGotoOptions): IFBMarker {
    const markerOptions: IFBMarkerOptions = {
      position: options.position,
      showHeightReference: true,
      style: structuredClone(DEFAULT_COMPLETED_GOTO_MARKER_STYLE),
      visible: true,
      editable: false,
      hoverable: false,
      clickable: false,
    };

    return this._compositeManager.createFBMarker(markerOptions);
  }
}
