import {
  IPosition,
  IThreadModelOptions,
  IThreatModel,
  IThreatModelLabelStyle,
} from '@map/public/contracts';
import { HeightReferenceEnum, MapColor } from '@map/public/core';
import {
  ColorBlendModeEnum,
  ICompositeManager,
  IFBModel,
  LabelStyle,
  ModelAttitude,
} from '@map/private/contracts';
import { v4 } from 'uuid';
import {
  DEFAULT_INTRUDER_LABEL_STYLE,
  DEFAULT_THREAT_LABEL_STYLE,
  DEFAULT_THREAT_MODEL_STYLE,
  ThreatColors,
} from '../constants';

export class ThreatModel implements IThreatModel {
  private _threatModel!: IFBModel;
  public readonly _id: string;
  public readonly _position: IPosition;
  private _compositeManager: ICompositeManager;

  constructor(
    compositeManager: ICompositeManager,
    options: IThreadModelOptions,
    isThreat: boolean
  ) {
    this._id = options.id || `threat-model-${v4()}`;

    this._compositeManager = compositeManager;
    this._position = options.position;

    if (
      !options.position ||
      options.position.latitude === undefined ||
      options.position.longitude === undefined
    ) {
      console.error('Invalid threat model position');
      return;
    }

    this._threatModel = this.createThreatModel(options, isThreat);

    if (isThreat) {
      this._threatModel.setStyle({
        color: ThreatColors.ACTIVE_THREAT,
      });
    } else {
      this._threatModel.setStyle({
        color: ThreatColors.INTRUDER,
      });
    }
  }

  get id(): string {
    return this._id;
  }

  get position(): IPosition {
    return this._threatModel.position;
  }

  setVisibility(visible: boolean): void {
    this._threatModel.setVisibility(visible);
  }

  remove(): void {
    this._threatModel.remove();
  }

  updatePosition(position: IPosition): void {
    this._threatModel.updatePosition(position);
  }

  setIntruder(): void {
    this._threatModel.setStyle({
      color: ThreatColors.INTRUDER,
      silhouetteColor: MapColor.WHITE,
      silhouetteSize: 1,
    });
    this._threatModel.updateLabelStyle({
      fillColor: MapColor.WHITE,
      backgroundColor: ThreatColors.INTRUDER,
    });
  }

  setActiveThreat(): void {
    this._threatModel.setStyle({
      color: ThreatColors.ACTIVE_THREAT,
    });

    this._threatModel.updateLabelStyle({
      fillColor: MapColor.ERROR,
      backgroundColor: MapColor.BLACK,
    });
  }

  updateProperties(properties: { attitude?: ModelAttitude }): void {
    if (properties.attitude) {
      this._threatModel.setAttitude(properties.attitude);
    }
  }

  updateLabelText(text: string): void {
    this._threatModel.setLabelText(text);
  }

  updateLabelStyle(style: IThreatModelLabelStyle): void {
    this._threatModel.updateLabelStyle(style);
  }

  updateScale(scale: number): void {
    if (scale <= 0 || isNaN(scale)) {
      console.error('Invalid threat model scale');
      return;
    }
    this._threatModel.setStyle({ scale });
  }

  panTo(): void {
    this._threatModel.panTo();
  }

  // Private Methods
  private createThreatModel(
    options: IThreadModelOptions,
    isThreat: boolean
  ): IFBModel {
    const threatModel = this._compositeManager.createFBModel({
      position: options.position,
      style: structuredClone(DEFAULT_THREAT_MODEL_STYLE),
      scale: options.scale,
      hoverable: false,
      clickable: false,
      editable: false,
      visible: true,
      labelText: options.labelText,
      labelStyle: isThreat
        ? structuredClone(DEFAULT_THREAT_LABEL_STYLE)
        : structuredClone(DEFAULT_INTRUDER_LABEL_STYLE),
      showHeightReference: true,
    });

    return threatModel;
  }
}
