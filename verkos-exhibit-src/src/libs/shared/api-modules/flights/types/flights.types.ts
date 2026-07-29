export interface FlightMission {
  mission_name: string;
  mission_id: string;
  type: string;
  mission_start_time: string;
  mission_end_time: string;
}

export interface FlightLog {
  flight_id: string;
  task_id?: string;
  site_details: {
    site_id: string;
    site_name: string;
  };
  drone_details: {
    drone_id: string;
    drone_name: string;
    drone_model: string;
  };
  docking_station: {
    docking_station_name: string;
    docking_station_id: string;
  };
  missions: FlightMission[];
  timestamp: string;
  total_media: number;
  uploaded_media: number;
  fb_media_count: number;
  media_metadata_count: number;
}

export interface FlightsResponse {
  flightLogs: FlightLog[];
  total: { value: number; relation: string };
  page: string;
  limit: string;
}
