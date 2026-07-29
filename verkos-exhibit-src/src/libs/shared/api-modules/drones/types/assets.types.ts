export interface Asset {
  _id: string;
  asset_id: number;
  export_id: number;
  status: string;
  name: string;
  raw_file_key: string;
  processed_files_key: string;
  description: string;
  organization_id: string;
  type: string;
  opacity: number;
  size: number;
  created_at: Date;
  updated_at: Date;
  created_by: {
    name: string;
  };
  site_ids: string[];
  file_name: string;
  is_overlaid: boolean;
}
