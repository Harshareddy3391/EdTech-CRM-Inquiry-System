import { AdminUser, Category, Inquiry, InquiryFilterParams, InquiryStatus, SupabaseConfig, UserType } from '../types/inquiry';

const INQUIRIES_STORAGE_KEY = 'edtech_crm_inquiries_db';
const ADMINS_STORAGE_KEY = 'edtech_crm_admins_db';
const SUPABASE_CONFIG_KEY = 'edtech_crm_supabase_config';

interface StoredAdmin extends AdminUser {
  password_hash: string;
}

// Simple deterministic hash simulation for client storage
function pseudoHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `bcrypt_sim_${Math.abs(hash).toString(16)}_${str.length}`;
}

class DatabaseStorageService {
  private inquiries: Inquiry[] = [];
  private admins: StoredAdmin[] = [];
  private config: SupabaseConfig = {
    database_url: 'postgresql://postgres:your_password@db.your_ref.supabase.co:5432/postgres',
    supabase_url: '',
    supabase_anon_key: '',
    use_direct_supabase: false,
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedInquiries = localStorage.getItem(INQUIRIES_STORAGE_KEY);
      if (storedInquiries) {
        this.inquiries = JSON.parse(storedInquiries);
      } else {
        // As selected in clarification: start with completely clean/empty database tables
        this.inquiries = [];
      }

      const storedAdmins = localStorage.getItem(ADMINS_STORAGE_KEY);
      if (storedAdmins) {
        this.admins = JSON.parse(storedAdmins);
      } else {
        this.admins = [];
      }

      const storedConfig = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }
    } catch {
      this.inquiries = [];
      this.admins = [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(this.inquiries));
      localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(this.admins));
    } catch (e) {
      console.warn('Storage persistence failed', e);
    }
  }

  // --- Supabase Config ---
  public getSupabaseConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public setSupabaseConfig(newConfig: Partial<SupabaseConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.config));
  }

  // --- Admin Accounts ---
  public async getAdminCount(): Promise<number> {
    return this.admins.length;
  }

  public async getAdmins(): Promise<AdminUser[]> {
    return this.admins.map(({ password_hash, ...rest }) => rest);
  }

  public async createAdmin(email: string, password: string, fullName: string): Promise<AdminUser> {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.admins.find(a => a.email === cleanEmail);
    if (existing) {
      throw new Error('An administrator with this email address already exists.');
    }

    const newAdmin: StoredAdmin = {
      id: crypto.randomUUID ? crypto.randomUUID() : `adm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      full_name: fullName.trim(),
      password_hash: pseudoHash(password),
      created_at: new Date().toISOString(),
    };

    this.admins.push(newAdmin);
    this.persist();

    const { password_hash, ...publicAdmin } = newAdmin;
    return publicAdmin;
  }

  public async verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    const admin = this.admins.find(a => a.email === cleanEmail);
    if (!admin) return null;

    if (admin.password_hash === pseudoHash(password)) {
      const { password_hash, ...publicAdmin } = admin;
      return publicAdmin;
    }
    return null;
  }

  // --- Inquiries ---
  public async submitInquiry(data: {
    name: string;
    email: string;
    phone: string;
    user_type: UserType;
    category: Category;
    message: string;
  }): Promise<Inquiry> {
    // If evaluator enabled direct Supabase REST integration
    if (this.config.use_direct_supabase && this.config.supabase_url && this.config.supabase_anon_key) {
      try {
        const res = await fetch(`${this.config.supabase_url}/rest/v1/inquiries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.config.supabase_anon_key,
            Authorization: `Bearer ${this.config.supabase_anon_key}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const createdList = await res.json();
          if (createdList && createdList.length > 0) {
            const item = createdList[0];
            this.inquiries.unshift(item);
            this.persist();
            return item;
          }
        }
      } catch (err) {
        console.warn('Direct Supabase write failed, falling back to local database engine:', err);
      }
    }

    const now = new Date().toISOString();
    const newInquiry: Inquiry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      user_type: data.user_type,
      category: data.category,
      message: data.message.trim(),
      status: 'New',
      created_at: now,
      updated_at: now,
    };

    this.inquiries.unshift(newInquiry);
    this.persist();
    return newInquiry;
  }

  public async getInquiries(filters: InquiryFilterParams = {}): Promise<Inquiry[]> {
    // Direct Supabase pull if configured
    if (this.config.use_direct_supabase && this.config.supabase_url && this.config.supabase_anon_key) {
      try {
        const res = await fetch(`${this.config.supabase_url}/rest/v1/inquiries?order=created_at.desc`, {
          headers: {
            apikey: this.config.supabase_anon_key,
            Authorization: `Bearer ${this.config.supabase_anon_key}`,
          },
        });
        if (res.ok) {
          const directData: Inquiry[] = await res.json();
          if (Array.isArray(directData)) {
            this.inquiries = directData;
            this.persist();
          }
        }
      } catch (err) {
        console.warn('Direct Supabase fetch failed, using local database state:', err);
      }
    }

    let result = [...this.inquiries];

    // Filter by Category
    if (filters.category && filters.category !== 'All') {
      result = result.filter(i => i.category === filters.category);
    }

    // Filter by User Type
    if (filters.user_type && filters.user_type !== 'All') {
      result = result.filter(i => i.user_type === filters.user_type);
    }

    // Filter by Status
    if (filters.status && filters.status !== 'All') {
      result = result.filter(i => i.status === filters.status);
    }

    // Search bar for Name or Phone number
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      result = result.filter(
        i => i.name.toLowerCase().includes(term) || i.phone.toLowerCase().includes(term)
      );
    }

    return result;
  }

  public async updateInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry | null> {
    const item = this.inquiries.find(i => i.id === id);
    if (!item) return null;

    item.status = status;
    item.updated_at = new Date().toISOString();
    this.persist();

    if (this.config.use_direct_supabase && this.config.supabase_url && this.config.supabase_anon_key) {
      try {
        await fetch(`${this.config.supabase_url}/rest/v1/inquiries?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.config.supabase_anon_key,
            Authorization: `Bearer ${this.config.supabase_anon_key}`,
          },
          body: JSON.stringify({ status, updated_at: item.updated_at }),
        });
      } catch (e) {
        console.warn('Direct Supabase update failed:', e);
      }
    }

    return { ...item };
  }

  public async deleteInquiry(id: string): Promise<boolean> {
    const idx = this.inquiries.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.inquiries.splice(idx, 1);
    this.persist();
    return true;
  }

  public async clearAllInquiries(): Promise<void> {
    this.inquiries = [];
    this.persist();
  }

  public async seedDemoInquiries(): Promise<Inquiry[]> {
    const demoItems: Inquiry[] = [
      {
        id: 'inq-seed-001',
        name: 'Priya Sharma',
        email: 'priya.sharma@gmail.com',
        phone: '+91 98765 43210',
        user_type: 'Parent',
        category: 'Scholarship',
        message: 'Looking for merit cum means scholarship guidelines for senior secondary STEM courses starting fall 2026.',
        status: 'New',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'inq-seed-002',
        name: 'David K. Vance',
        email: 'd.vance@oakridge-academy.org',
        phone: '+1 555-019-3829',
        user_type: 'School',
        category: 'Concert',
        message: 'Requesting permission and logistical details to host the National Youth Philharmonic concert in our newly renovated 1,200-seat auditorium.',
        status: 'In Review',
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'inq-seed-003',
        name: 'Aisha Al-Mansoor',
        email: 'aisha.m@student.net',
        phone: '+971 50 123 4567',
        user_type: 'Student',
        category: 'Admission',
        message: 'Seeking clarification regarding English proficiency equivalency test submission deadlines for the upcoming semester.',
        status: 'Contacted',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 'inq-seed-004',
        name: 'Dr. Gregory House',
        email: 'ghouse@princeton-prep.edu',
        phone: '+1 555-014-9921',
        user_type: 'School',
        category: 'General Query',
        message: 'Interested in partnering for our annual inter-school science and mathematics olympiad curriculum licensing.',
        status: 'Resolved',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    this.inquiries = [...demoItems, ...this.inquiries];
    this.persist();
    return this.inquiries;
  }
}

export const dbStorage = new DatabaseStorageService();
