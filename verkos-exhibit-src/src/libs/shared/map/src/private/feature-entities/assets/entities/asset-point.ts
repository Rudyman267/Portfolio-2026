import {
  AssetMetadata,
  IAssetMarkerStyle,
  IAssetPoint,
  IAssetPointOptions,
  IPosition,
} from '@map/public/contracts';
import { ICompositeManager, IFBMarker } from '@map/private/contracts';
import { v4 } from 'uuid';
import {
  DEFAULT_ASSET_LABEL_STYLE,
  DEFAULT_ASSET_MARKER_STYLE,
} from '../constants';
import { HeightReferenceEnum } from '@map/public';

export class AssetPoint implements IAssetPoint {
  private _id: string;
  private _assetMarker: IFBMarker;
  private _assetId: string;
  private _metadata: AssetMetadata;

  constructor(
    private _compositeManager: ICompositeManager,
    options: IAssetPointOptions,
    private _styleConfig: {
      getAssetIconUrl: (category: string) => string;
      getAssetCategoryColor: (category: string) => string;
    }
  ) {
    this._id = `asset-point-${v4()}`;
    this._assetId = options.assetId;
    this._metadata = options.metadata;

    this._assetMarker = this.createAssetMarker(options);
  }

  get id(): string {
    return this._id;
  }

  get assetId(): string {
    return this._assetId;
  }

  get position(): IPosition {
    return this._assetMarker.position;
  }

  get metadata(): AssetMetadata {
    return this._metadata;
  }

  get visible(): boolean {
    return this._assetMarker.visible;
  }

  async updatePosition(position: IPosition): Promise<void> {
    await this._assetMarker.updatePosition(position);
  }

  setStyle(style: Partial<IAssetMarkerStyle>): void {
    this._assetMarker.setStyle(style);
  }

  updateIcon(iconUrl: string): void {
    this._assetMarker.updateImage(iconUrl);
  }

  setScale(scale: number): void {
    this._assetMarker.setStyle({ scale });
  }

  setLabelText(text: string): void {
    this._assetMarker.setLabelText(text);
  }

  setLabelVisibility(visible: boolean): void {
    // TODO: Implement when FB marker supports label visibility control
    console.warn('Label visibility control not yet implemented in FB marker', {
      visible,
    });
  }

  setVisibility(visible: boolean): void {
    this._assetMarker.setVisibility(visible);
  }

  setInteractive(interactive: boolean): void {
    this._assetMarker.setClickable(interactive);
    this._assetMarker.setHoverable(interactive);
  }

  panTo(): void {
    this._assetMarker.panTo();
  }

  remove(): void {
    if (this._assetMarker) {
      this._assetMarker.remove();
    }
  }

  // priavate methods
  private createAssetMarker(options: IAssetPointOptions): IFBMarker {
    const assetMarker = this._compositeManager.createFBMarker({
      // Use assetId as the underlying FB entity ID for stable event propagation
      // and simpler lookup/event-bubbling behavior across the stack.
      id: options.assetId,
      position: options.position,
      style: {
        ...structuredClone(DEFAULT_ASSET_MARKER_STYLE),
        image:
          options.iconUrl ||
          this._styleConfig.getAssetIconUrl(options.metadata.category),
        color: this._styleConfig.getAssetCategoryColor(
          options.metadata.category
        ),
      },
      labelText: options.labelText ?? undefined,
      labelStyle: options.labelText
        ? structuredClone(DEFAULT_ASSET_LABEL_STYLE)
        : undefined,
      showHeightReference: false,
      clickable: options.interactive ?? false,
      hoverable: options.interactive ?? false,
    });

    return assetMarker;
  }
}
