import {
  AssetMetadata,
  IAssetPolygon,
  IAssetPolygonOptions,
  IAssetPolygonStyle,
  IPosition,
} from '@map/public/contracts';
import { ICompositeManager, IFBPolygon } from '@map/private/contracts';
import { v4 } from 'uuid';
import {
  DEFAULT_ASSET_LABEL_STYLE,
  DEFAULT_ASSET_POLYGON_STYLE,
} from '../constants';

export class AssetPolygon implements IAssetPolygon {
  private _id: string;
  private _assetPolygon: IFBPolygon;
  private _assetId: string;
  private _metadata: AssetMetadata;

  constructor(
    private _compositeManager: ICompositeManager,
    options: IAssetPolygonOptions,
    private _styleConfig: {
      getAssetCategoryColor: (category: string) => string;
    }
  ) {
    this._id = `asset-polygon-${v4()}`;
    this._assetId = options.assetId;
    this._metadata = options.metadata;

    this._assetPolygon = this.createAssetPolygon(options);
  }

  get id(): string {
    return this._id;
  }

  get assetId(): string {
    return this._assetId;
  }

  get positions(): IPosition[] {
    return this._assetPolygon.positions;
  }

  get metadata(): AssetMetadata {
    return this._metadata;
  }

  get visible(): boolean {
    return this._assetPolygon.visible;
  }

  setPositions(positions: IPosition[]): void {
    this._assetPolygon.setPositions(positions);
  }

  addPosition(position: IPosition): void {
    // Get current positions, add new position, then set all positions
    const currentPositions = [...this._assetPolygon.positions, position];
    this._assetPolygon.setPositions(currentPositions);
  }

  updatePosition(index: number, position: IPosition): void {
    // Get current positions, update the specific index, then set all positions
    const currentPositions = [...this._assetPolygon.positions];
    if (index >= 0 && index < currentPositions.length) {
      currentPositions[index] = position;
      this._assetPolygon.setPositions(currentPositions);
    }
  }

  setStyle(style: Partial<IAssetPolygonStyle>): void {
    this._assetPolygon.setStyle(style);
  }

  setFillColor(color: string): void {
    this._assetPolygon.setStyle({ fillColor: color });
  }

  setOutlineColor(color: string): void {
    this._assetPolygon.setStyle({ outlineColor: color });
  }

  setFillOpacity(opacity: number): void {
    this._assetPolygon.setStyle({ alpha: opacity });
  }

  setOutlineWidth(width: number): void {
    this._assetPolygon.setStyle({ outlineWidth: width });
  }

  setVisibility(visible: boolean): void {
    this._assetPolygon.setVisibility(visible);
  }

  setInteractive(interactive: boolean): void {
    this._assetPolygon.setClickable(interactive);
    this._assetPolygon.setHoverable(interactive);
  }

  panTo(): void {
    this._assetPolygon.panTo();
  }

  remove(): void {
    if (this._assetPolygon) {
      this._assetPolygon.remove();
    }
  }

  // private methods
  private createAssetPolygon(options: IAssetPolygonOptions): IFBPolygon {
    const assetPolygon = this._compositeManager.createFBPolygon({
      // Use assetId as the underlying FB entity ID for stable event propagation.
      id: options.assetId,
      positions: options.positions,
      style: {
        ...structuredClone(DEFAULT_ASSET_POLYGON_STYLE),
        fillColor:
          options.fillColor ||
          this._styleConfig.getAssetCategoryColor(options.metadata.category),
        outlineColor:
          options.outlineColor ||
          this._styleConfig.getAssetCategoryColor(options.metadata.category),
        ...(options.fillOpacity ? { alpha: options.fillOpacity } : {}),
        ...(options.outlineWidth ? { outlineWidth: options.outlineWidth } : {}),
      },
      labelText: options.labelText ?? undefined,
      labelStyle: options.labelText
        ? {
            ...structuredClone(DEFAULT_ASSET_LABEL_STYLE),
          }
        : undefined,
      clickable: options.interactive ?? false,
      hoverable: options.interactive ?? false,
    });

    return assetPolygon;
  }
}
