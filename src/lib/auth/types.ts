export type UserRole = 'free' | 'paid' | 'admin';

export interface NutriUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  patient_id?: string;
  customer_id?: string;
  erp_api_key?: string;
  erp_api_secret?: string;
  ghost_member_id?: string;
}

export interface NutriSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    patient_id?: string;
    customer_id?: string;
    ghost_member_id?: string;
  };
  erp_api_key?: string;
  erp_api_secret?: string;
  expires: string;
}
