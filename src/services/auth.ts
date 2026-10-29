import { AdminUser, AuthSession } from '../types/inquiry';
import { dbStorage } from './storage';

const SESSION_STORAGE_KEY = 'edtech_crm_jwt_session';
const JWT_SECRET = 'custom_jwt_secret_key_change_in_production_edtech_crm';

// Simple base64url encode/decode for custom client-side JWT handling
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0: break;
    case 2: output += '=='; break;
    case 3: output += '='; break;
    default: throw new Error('Illegal base64url string!');
  }
  return decodeURIComponent(escape(atob(output)));
}

// Generate custom signed JWT (HS256 compatible simulation)
function generateCustomJwt(admin: AdminUser, expiresInMinutes: number = 1440): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: admin.id,
    email: admin.email,
    name: admin.full_name,
    iat: now,
    exp: now + expiresInMinutes * 60,
    iss: 'edtech-crm-backend',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  // Deterministic signature hash simulation
  const signatureRaw = `${encodedHeader}.${encodedPayload}.${JWT_SECRET}`;
  const encodedSignature = base64UrlEncode(signatureRaw.slice(0, 32));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// Verify custom JWT
export function verifyCustomJwt(token: string): { valid: boolean; payload?: any; reason?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Invalid token structure' };
    }

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: 'Malformed token payload' };
  }
}

class AuthService {
  private currentSession: AuthSession | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        const verification = verifyCustomJwt(session.access_token);
        if (verification.valid) {
          this.currentSession = session;
        } else {
          this.logout();
        }
      }
    } catch {
      this.currentSession = null;
    }
  }

  public getSession(): AuthSession | null {
    if (!this.currentSession) return null;
    const verification = verifyCustomJwt(this.currentSession.access_token);
    if (!verification.valid) {
      this.logout();
      return null;
    }
    return this.currentSession;
  }

  public isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  public async login(email: string, password: string): Promise<AuthSession> {
    const admin = await dbStorage.verifyAdminCredentials(email, password);
    if (!admin) {
      throw new Error('Invalid email or password combination.');
    }

    const access_token = generateCustomJwt(admin);
    const session: AuthSession = {
      access_token,
      token_type: 'bearer',
      admin,
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
    };

    this.currentSession = session;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  public async register(email: string, password: string, fullName: string): Promise<AuthSession> {
    const admin = await dbStorage.createAdmin(email, password, fullName);
    const access_token = generateCustomJwt(admin);
    const session: AuthSession = {
      access_token,
      token_type: 'bearer',
      admin,
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
    };

    this.currentSession = session;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  public logout() {
    this.currentSession = null;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export const authService = new AuthService();
