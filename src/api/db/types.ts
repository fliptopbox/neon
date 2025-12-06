export interface User {
  id: number;
  emailaddress: string;
  password: string;
  created_on: Date;
  active: number;
  confirmed_on: Date | null;
  login_on: Date;
  is_admin?: boolean;
}

export interface UserBio {
  id: number;
  user_id: number;
  instagram: string | null;
  description: string | null;
  websites: any;
  fullname: string;
  known_as: string | null;
  created_on: Date;
  modified_on: Date;
}

export interface Model {
  id: number;
  user_id: number;
  sex: number;
  instagram: string;
  portrait: string;
  account_holder: string | null;
  account_number: string | null;
  account_sortcode: string | null;
  created_on: Date;
  modified_on: Date;
  active: number;
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
