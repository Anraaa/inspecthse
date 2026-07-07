export type Role = "SUPER_ADMIN" | "K3L" | "TIM_HSE";

export type AssetCategory = "APAR" | "HYDRANT" | "FIRE_ALARM";
export type InputType = "boolean" | "numeric" | "text" | "option";
export type CheckType = "fisik" | "fungsi";
export type PatrolStatus = "draft" | "submitted" | "waiting_approval" | "approved" | "rejected";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  section_id?: number;
  is_active: boolean;
}

export interface Asset {
  id: number;
  name: string;
  asset_category: AssetCategory;
  serial_number: string;
  location_id: number;
  pic_id: number;
  section_id: number;
  plant: string;
  size: string;
  expired_at?: string;
  qr_code: string;
  is_active: boolean;
}

export interface Location {
  id: number;
  name: string;
  description: string;
  qr_code?: string | null;
}

export interface Section {
  id: number;
  name: string;
  description: string;
}

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
}

export interface HSEParameter {
  id: number;
  asset_category: AssetCategory;
  parameter_name: string;
  input_type: InputType;
  unit: string;
  options: string;
  check_type: CheckType;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
}

export interface Patrol {
  id: number;
  user_id: number;
  asset_id: number;
  shift_id: number;
  status: PatrolStatus;
  client_uuid: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  submitted_at?: string;
}

export interface PatrolDetail {
  id: number;
  patrol_id: number;
  hse_parameter_id: number;
  value: string;
  is_anomaly: boolean;
  notes: string;
}

export interface PatrolAttachment {
  id: number;
  patrol_id: number;
  patrol_detail_id?: number;
  file_path: string;
  attachment_type: string;
  is_live_capture: boolean;
}

export interface PatrolDetailResponse {
  patrol: Patrol;
  details: PatrolDetail[];
  attachments: PatrolAttachment[];
}

export interface Alert {
  id: number;
  patrol_id: number;
  asset_id: number;
  pic_id: number;
  message: string;
  is_read: boolean;
  resolved_at?: string;
  created_at: string;
}
