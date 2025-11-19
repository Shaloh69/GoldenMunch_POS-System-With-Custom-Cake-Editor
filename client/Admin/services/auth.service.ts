import { apiClient } from '@/config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'cashier';
  };
}

class AuthService {
  async loginAdmin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/admin/login', credentials);
    const { token, admin } = response.data;

    // Store token
    localStorage.setItem('admin_token', token);

    return {
      token,
      user: {
        id: admin.admin_id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
      },
    };
  }

  async loginCashier(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/cashier/login', credentials);
    const { token, cashier } = response.data;

    // Store token
    localStorage.setItem('cashier_token', token);

    return {
      token,
      user: {
        id: cashier.cashier_id,
        email: cashier.email,
        name: cashier.name,
        role: 'cashier',
      },
    };
  }

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('cashier_token');
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!(localStorage.getItem('admin_token') || localStorage.getItem('cashier_token'));
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token') || localStorage.getItem('cashier_token');
  }
}

export const authService = new AuthService();
