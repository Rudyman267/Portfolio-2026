/**
 * Drone Types
 */

export interface Payload {
  _id: string;
  is_delete: boolean;
  payload_index: string;
  edge_type: number;
  model: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  name: string;
  model: string;
  device_type: string;
  serial_no: string;
  id: string;
  drone_type: string | null;
  namespace: string;
  manufacturer: string;
  created_by: string;
  edge_type: number;
  operation_halt_reasons: any[];
  type?: string; // Only for DockingStation
  payloads: Payload[];
}

export interface Site {
  _id: string;
  name: string;
}

export interface PlanType {
  _id: string;
  is_delete?: boolean;
  name: string;
  desc: string;
  type: string;
  supported_features: string[];
  supported_devices: string[];
  credit_value: number;
  is_active: boolean;
  notes: string | null;
  validity_in_days: number;
  validity_type?: string;
  created_at: string;
  updated_at: string;
  __v?: number;
}

export interface PlanDetails {
  _id: string;
  is_delete?: boolean;
  activation_code: string;
  auto_generated_code?: boolean;
  custom_value: number;
  plan_type: PlanType;
  partner_org_id: string;
  purchased_date: string;
  code_expiry_date: string;
  activationStatus: string;
  customer_email: string | null;
  customer_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  subscription_id: string;
  expiry_date: string;
  subs: {
    _id: string;
    is_delete?: boolean;
    customer_org_id: string;
    plan_details: PlanDetails;
    binding_id: string;
    activation_date: string;
    renewal_date: string;
    expiry_notified_at: number | null;
    created_at: string;
    updated_at: string;
    __v?: number;
    supported_devices?: string[];
  };
  plan_details: PlanDetails;
}

export interface PartnerDetail {
  _id: string;
  name: string;
}

export interface DeviceBinding {
  _id: string;
  isBinded: boolean;
  site: Site;
  devices: Device[];
  subscription: Subscription[];
  partner_details: PartnerDetail[];
}

export interface DeviceBindingsResponse {
  pageNumber: number;
  pageSize: number;
  total: number;
  data: DeviceBinding[];
}
