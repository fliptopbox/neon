export type Status = 'cancelled' | 'closed' | 'confirmed' | 'noshow' | 'opencall' | 'pending';
export type Sex = 'unspecified' | 'male' | 'female';
export type Frequency = 'adhoc' | 'once' | 'daily' | 'weekly' | 'biweekly' | 'triweekly' | 'monthly' | 'quarterly' | 'annually';
export type WeekDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'unknown';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  is_global_active: boolean; // default true
  is_admin: boolean; // default false
  date_last_seen: string | null; // timestamptz
  date_created: string; // timestamptz
}

export interface UserProfile {
  id: number;
  user_id: number;
  handle: string;
  fullname: string;
  phone_number: string;
  description: string;
  avatar_url: string;
  currency_code: string; // char(3) default 'GBP'
  flag_emoji: string;
  payment_methods: PaymentMethods; // JSON
  date_created: string;
  is_profile_active: boolean; // default true
}

export interface PaymentMethods {
  monzo?: string | null;
  revolut?: string | null;
  paypal?: string | null;
  bank?: {
    name?: string | null;
    sort_code?: string | null;
    account_number?: string | null;
    iban?: string | null;
  } | null;
  [key: string]: any;
}

export interface Venue {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2: string;
  address_city: string; // default 'London'
  address_county: string;
  address_postcode: string; // default 'UNKNOWN'
  address_area: string;
  tz: string; // default 'Europe/London'
  capacity: number;
  venue_tags: string[]; // JSON array
  comments: string;
  active: boolean; // default true
  latitude: number | null; // decimal
  longitude: number | null; // decimal
  date_created: string;
  date_modified: string;
}

export interface Calendar {
  id: number;
  event_id: number | null;
  user_id: number | null;
  status: Status | null;
  attendance_inperson: number;
  attendance_online: number;
  date_time: string | null; // datetime
  duration: number; // decimal
  pose_format: string | null;
}

export interface Model {
  id: number;
  user_id: number;
  display_name: string | null;
  description: string;
  portrait_urls: string[]; // JSON array
  rate_min_hour: number | null; // decimal
  rate_min_day: number | null; // decimal
  tz: string;
  work_inperson: boolean;
  work_online: boolean;
  work_photography: boolean;
  work_seeks: string[]; // JSON array
  website_urls: string[]; // JSON array
  social_handles: Record<string, string | null>; // JSON object
  date_birthday: string | null;
  date_experience: string | null;
  sex: Sex;
  pronouns: string;
  date_created: string;
}

export interface Host {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  social_handles: Record<string, string | null>; // JSON object
  default_date_time: string;
  default_duration: number; // decimal
  rate_max_hour: number; // decimal
  rate_max_day: number; // decimal
  tz: string;
  date_created: string;
  host_tags: string[]; // JSON array
}

export interface Event {
  id: number;
  venue_id: number | null;
  user_id: number;
  name: string;
  description: string | null;
  images: string[]; // JSON array
  frequency: Frequency;
  week_day: WeekDay;
  pricing_table: any[]; // JSON
  pricing_text: string;
  pricing_tags: string[]; // JSON array
  pose_format: string;
}

export interface ExchangeRate {
  currency_code: string;
  rate_to_usd: number; // decimal
  updated_at: string;
}

export interface Tracking {
  id: number;
  user_id: number;
  href: string;
  timestamp: string | null;
}
