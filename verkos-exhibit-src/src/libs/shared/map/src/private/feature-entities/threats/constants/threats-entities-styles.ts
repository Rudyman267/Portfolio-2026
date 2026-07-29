import {
  ColorBlendModeEnum,
  LabelHorizontalOrigin,
  LabelStyle,
  LabelVerticalOrigin,
  ModelStyle,
} from '@map/private/contracts';
import { HeightReferenceEnum, MapColor } from '@map/public';

export enum ThreatColors {
  ACTIVE_THREAT = '#E53535', //Red Threat
  INTRUDER = '#575757', //Gray Threat
  THREAT_OUTLINE = '#FFF', //White Threat
}

export enum ThreatModels {
  THREAT = 'assets/models/threat/threat-model.glb',
  INTRUDER = 'assets/models/threat/intruder-model.glb',
}

export const DEFAULT_THREAT_MODEL_STYLE: ModelStyle = {
  modelUri: ThreatModels.THREAT,
  scale: 2.0,
  color: ThreatColors.ACTIVE_THREAT,
  colorBlendMode: ColorBlendModeEnum.REPLACE,
  silhouetteColor: undefined,
  silhouetteSize: undefined,
  colorBlendAmount: 0.5,
  minimumPixelSize: 86,
  maximumScale: 300,
  heightReference: HeightReferenceEnum.NONE,
};

export const DEFAULT_THREAT_LABEL_STYLE: LabelStyle = {
  font: 'ultra-expanded bold 16px "DM Sans", sans-serif',
  fillColor: MapColor.ERROR,
  outlineColor: MapColor.BLACK,
  outlineWidth: 2,
  style: 0, // FILL
  scale: 0.7,
  showBackground: true,
  backgroundColor: MapColor.BLACK,
  backgroundAlpha: 0.8,
  backgroundPadding: { x: 7, y: 5 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  pixelOffset: { x: 0, y: 15 },
  horizontalOrigin: LabelHorizontalOrigin.CENTER,
  verticalOrigin: LabelVerticalOrigin.TOP,
  heightReference: HeightReferenceEnum.NONE,
};

export const DEFAULT_INTRUDER_LABEL_STYLE: LabelStyle = {
  font: 'ultra-expanded bold 16px "DM Sans", sans-serif',
  fillColor: MapColor.WHITE,
  outlineColor: MapColor.BLACK,
  outlineWidth: 2,
  style: 0,
  scale: 0.7,
  showBackground: true,
  backgroundColor: ThreatColors.INTRUDER,
  backgroundAlpha: 0.8,
  backgroundPadding: { x: 7, y: 5 },
  eyeOffset: { x: 0, y: 0, z: 0 },
  pixelOffset: { x: 0, y: 15 },
  horizontalOrigin: LabelHorizontalOrigin.CENTER,
  verticalOrigin: LabelVerticalOrigin.TOP,
  heightReference: HeightReferenceEnum.NONE,
};
