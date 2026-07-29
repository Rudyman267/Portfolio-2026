export interface LensZoomRange {
  min: number;
  max: number;
}

export interface LensZoomStep {
  steps: number[];
  stepsLabel: string[];
}

export interface LensZoomOptions {
  floor: number;
  ceil: number;
  step: number;
  showTickValues: boolean;
  vertical: boolean;
  stepsArray: { value: number }[];
}

export interface LensZoom {
  is_supported: boolean;
  range?: LensZoomRange;
  step?: LensZoomStep;
  options?: LensZoomOptions;
}

export interface SupportedLens {
  _id: string;
  is_delete: boolean;
  id: number;
  name: string;
  alias: string;
  zoom: LensZoom;
  thermal_pallete: { is_supported: boolean };
  edge_type: number;
  focus_control_supported: boolean;
  ir_metering_control_supported: boolean;
  index: number;
}

export interface LensSelection {
  allowsLensSelection: boolean;
  supportedLenses: SupportedLens[];
  sideBySideSupported: boolean;
}

export interface PayloadControl {
  allowGimbalInteraction: boolean;
  allowGimbalLock: boolean;
}

export interface ExposureOptions {
  floor: number;
  ceil: number;
  showTickValues: boolean;
  vertical: boolean;
  stepsArray: { value: number }[];
}

export interface Exposure {
  is_supported: boolean;
  range: LensZoomRange;
  options: ExposureOptions;
  label: number[];
}

export interface PayloadConfigItem {
  _id: string;
  payload_index: string;
  name: string;
  edgeType: number;
  is_delete: boolean;
  lensSelection?: LensSelection;
  allowsMediaCapture?: boolean;
  defaultVideoQuality?: number;
  supportsRangeFinder?: boolean;
  payloadControl?: PayloadControl;
  exposure?: Exposure;
}
