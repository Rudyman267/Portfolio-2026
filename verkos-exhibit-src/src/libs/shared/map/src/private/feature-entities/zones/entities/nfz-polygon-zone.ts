import { v4 } from 'uuid';
import { IPolygonZoneOptions, IZone, MapZoneType } from '@map/public/contracts';
import { ICompositeManager, IFBPolygon } from '@map/private/contracts';
import {
  DEFAULT_NFZ_LABEL_STYLE,
  DEFAULT_NFZ_POLYGON_STYLE,
} from '../constants';

export class NfzPolygonZone implements IZone {
  private _id: string;
  private _visible!: boolean;
  private _polygon: IFBPolygon;
  private readonly _compositeManager: ICompositeManager;
  constructor(
    compositeManager: ICompositeManager,
    option: IPolygonZoneOptions
  ) {
    this._id = `nfz-polygon-${v4()}`;
    this._compositeManager = compositeManager;
    this._visible = true;

    this._polygon = this.createNFZPolygon(option);
  }

  public get visible(): boolean {
    return this._visible;
  }

  public get id(): string {
    return this._id;
  }

  panTo(): void {
    this._polygon.panTo();
  }

  setVisibility(visible: boolean): void {
    this._visible = visible;
    this._polygon.setVisibility(visible);
  }

  destroy(): void {
    this._polygon.remove();
  }

  // private methods
  private createNFZPolygon(option: IPolygonZoneOptions): IFBPolygon {
    const nfzPolygon = this._compositeManager.createFBPolygon({
      positions: option.positions,
      labelText: option.labelText ?? 'Untitled NFZ',
      labelStyle: structuredClone(DEFAULT_NFZ_LABEL_STYLE),
      style: structuredClone(DEFAULT_NFZ_POLYGON_STYLE),
      editable: false,
      hoverable: false,
      clickable: false,
      visible: true,
    });
    return nfzPolygon;
  }
}
