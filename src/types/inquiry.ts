export type UserType = 'Parent' | 'Student' | 'School';

export type Category = 'Scholarship' | 'Concert' | 'Admission' | 'General Query';

export type InquiryStatus = 'New' | 'In Review' | 'Contacted' | 'Resolved';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: UserType;
  category: Category;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  admin: AdminUser;
  expires_at: number;
}

export interface InquiryFilterParams {
  category?: Category | 'All';
  user_type?: UserType | 'All';
  status?: InquiryStatus | 'All';
  search?: string;
}

export interface SupabaseConfig {
  database_url?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  use_direct_supabase: boolean;
}
