import {
  AssetMetadata,
  IAssetLine,
  IAssetLineOptions,
  IAssetPolylineStyle,
  IPosition,
} from '@map/public/contracts';
import { ICompositeManager, IFBPolyline } from '@map/private/contracts';
import { v4 } from 'uuid';
import {
  DEFAULT_ASSET_LABEL_STYLE,
  DEFAULT_ASSET_POLYLINE_STYLE,
} from '../constants';

export class AssetLine implements IAssetLine {
  private _id: string;
  private _assetPolyline: IFBPolyline;
  private _assetId: string;
  private _metadata: AssetMetadata;

  constructor(
    private _compositeManager: ICompositeManager,
    options: IAssetLineOptions,
    private _styleConfig: {
      getAssetCategoryColor: (category: string) => string;
    }
  ) {
    this._id = `asset-line-${v4()}`;
    this._assetId = options.assetId;
    this._metadata = options.metadata;

    this._assetPolyline = this.createAssetPolyline(options);
  }

  get id(): string {
    return this._id;
  }

  get assetId(): string {
    return this._assetId;
  }

  get positions(): IPosition[] {
    return this._assetPolyline.positions;
  }

  get metadata(): AssetMetadata {
    return this._metadata;
  }

  get visible(): boolean {
    return this._assetPolyline.visible;
  }

  setPositions(positions: IPosition[]): void {
    this._assetPolyline.setPositions(positions);
  }

  addPosition(position: IPosition): void {
    this._assetPolyline.addPosition(position);
  }

  updatePosition(index: number, position: IPosition): void {
    // Get current positions, update the specific index, then set all positions
    const currentPositions = [...this._assetPolyline.positions];
    if (index >= 0 && index < currentPositions.length) {
      currentPositions[index] = position;
      this._assetPolyline.setPositions(currentPositions);
    }
  }

  setStyle(style: IAssetPolylineStyle): void {
    this._assetPolyline.setStyle(style);
  }

  setColor(color: string): void {
    this._assetPolyline.setStyle({ color });
  }

  setWidth(width: number): void {
    this._assetPolyline.setStyle({ width });
  }

  setClampToGround(clamp: boolean): void {
    this._assetPolyline.setStyle({ clampToGround: clamp });
  }

  setVisibility(visible: boolean): void {
    this._assetPolyline.setVisibility(visible);
  }

  setInteractive(interactive: boolean): void {
    this._assetPolyline.setClickable(interactive);
    this._assetPolyline.setHoverable(interactive);
  }

  panTo(): void {
    this._assetPolyline.panTo();
  }

  remove(): void {
    if (this._assetPolyline) {
      this._assetPolyline.remove();
    }
  }

  // private methods
  private createAssetPolyline(options: IAssetLineOptions): IFBPolyline {
    const assetPolyline = this._compositeManager.createFBPolyline({
      // Use assetId as the underlying FB entity ID for stable event propagation.
      id: options.assetId,
      positions: options.positions,
      style: {
        ...structuredClone(DEFAULT_ASSET_POLYLINE_STYLE),
        color:
          options.color ||
          this._styleConfig.getAssetCategoryColor(options.metadata.category),
        ...(options.width ? { width: options.width } : {}),
        ...(options.clampToGround
          ? { clampToGround: options.clampToGround }
          : {}),
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

    return assetPolyline;
  }
}
