import { v4 } from 'uuid';
import { ICompositeManager, IFBMarker } from '@map/private/contracts';
import { IPosition, IRCMarker, IRCMarkerOptions } from '@map/public/contracts';
import {
  DEFAULT_DEVICE_MARKER_LABEL_STYLE,
  DEFAULT_RC_MARKER_STYLE,
  RC_MARKER_ASSETS,
} from '../constants';
import { HeightReferenceEnum } from '@map/public';

export class RCMarker implements IRCMarker {
  private _id: string;
  private rcMarker?: IFBMarker;
  private _isOnline = false;

  constructor(
    private _compositeManager: ICompositeManager,
    options: IRCMarkerOptions
  ) {
    this._id = `rc-marker-${v4()}`;
    const { position, connectionStatus } = options;

    if (
      !position ||
      !Number.isFinite(position.latitude) ||
      !Number.isFinite(position.longitude)
    ) {
      console.warn('Invalid RC marker position', position);
      return;
    }

    this._isOnline = connectionStatus;
    this.rcMarker = this._createRCMarker(options);
  }

  get id(): string {
    return this._id;
  }

  updatePosition(position: IPosition): void {
    if (
      !position ||
      !Number.isFinite(position.latitude) ||
      !Number.isFinite(position.longitude)
    ) {
      console.warn('Invalid RC marker position', position);
      return;
    }

    if (this.rcMarker) {
      this.rcMarker.updatePosition(position);
    }
  }

  setVisibility(visible: boolean): void {
    this.rcMarker?.setVisibility(visible);
  }

  setOnlineStatus(online: boolean): void {
    this._isOnline = online;
    this._updateMarkerImage();
  }

  setStyle(image: string): void {
    this.rcMarker?.updateImage(image);
  }

  panTo(): void {
    this.rcMarker?.panTo();
  }

  remove(): void {
    this.rcMarker?.remove();
  }

  // private methods
  private _updateMarkerImage(): void {
    const imagePath = this._isOnline
      ? RC_MARKER_ASSETS.ONLINE
      : RC_MARKER_ASSETS.OFFLINE;

    this.rcMarker?.updateImage(imagePath);
  }

  private _createRCMarker(options: IRCMarkerOptions): IFBMarker {
    const { position, connectionStatus, labelText } = options;

    const rcMarker = this._compositeManager.createFBMarker({
      position,
      labelText,
      labelStyle: {
        ...structuredClone(structuredClone(DEFAULT_DEVICE_MARKER_LABEL_STYLE)),
        heightReference: HeightReferenceEnum.CLAMP_TO_GROUND,
      },
      showHeightReference: false,
      style: {
        ...structuredClone(DEFAULT_RC_MARKER_STYLE),
        ...(connectionStatus
          ? { image: RC_MARKER_ASSETS.ONLINE }
          : { image: RC_MARKER_ASSETS.OFFLINE }),
      },
      visible: true,
      clickable: false,
      hoverable: false,
      editable: false,
    });
    return rcMarker;
  }
}
