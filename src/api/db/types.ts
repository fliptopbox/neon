export interface User {
  id: number;
  email: string;
  password_hash: string;
  is_global_active: boolean;
  is_admin: boolean;
  date_last_seen: Date | null;
  date_created: Date;
}

export interface UserProfile {
  id: number;
  user_id: number;
  handle: string;
  fullname: string;
  phone_number: string;
  description: string;
  avatar_url: string;
  currency_code: string;
  flag_emoji: string;
  payment_methods: any; // JSON
  interest_tags: string[];
  affiliate_urls: string[];
  date_created: Date;
  is_profile_active: boolean;
}

// Legacy alias for compatibility
export type UserBio = UserProfile;

export interface Model {
  id: number;
  user_id: number;
  user_profile_id?: number; // Optional until migration confirmed
  sex: number;
  instagram: string;
  portrait: string;
  account_holder: string | null;
  account_number: string | null;
  account_sortcode: string | null;
  created_on: Date;
  modified_on: Date;
  active: number;
  
  // New Metadata Fields
  display_name?: string;
  phone_number?: string;
  description?: string;
  currency_code: string;
  rate_min_hour: number;
  rate_min_day: number;
  tz: string;
  work_inperson: boolean;
  work_online: boolean;
  work_photography: boolean;
  work_seeks: string[];
  social_urls: string[];
  product_urls: string[];
  date_birthday?: Date;
  date_experience?: Date;
  pronouns: string;
  sells_online?: number;
}

export interface Artist {
  id: number;
  user_id: number;
  created_on: Date;
  modified_on: Date;
  active: number;
}

export interface Venue {
  id: number;
  user_id: number;
  name: string;
  week_day: number;
  frequency: string;
  instagram: string | null;
  website: string;
  address: string;
  timezone: string;
  start_time: string;
  duration: number;
  postcode: string;
  area: string;
  price_inperson: number;
  price_online: number;
  active: number;
  tags: any;
  created_on: Date;
  modified_on: Date;
}

export interface Image {
  id: number;
  user_id: number;
  type_id: number;
  src: string;
  active: number;
  created_on: Date;
  modified_on: Date;
}

export interface ImageType {
  id: number;
  name: string;
  description: string | null;
}
