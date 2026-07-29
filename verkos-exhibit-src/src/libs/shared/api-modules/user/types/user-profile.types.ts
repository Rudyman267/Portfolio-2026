export interface PhoneDetails {
  country_code: string;
  number: string;
  is_valid: boolean;
}

export interface AdditionalInfo {
  country: string;
  company: string;
  business_models: string[];
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url: string;
  is_staff: boolean;
  id: string;
  phone_details: PhoneDetails;
  profile_image_key: string;
  additional_info: AdditionalInfo;
  view_policy_page: boolean;
  name: string;
}

export interface UserProfileResponse {
  status: boolean;
  code: string;
  message: string;
  data: UserProfile;
}
