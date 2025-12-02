import { apiClient } from '@/lib/api-client';
import type { AuthResponse, LoginRequest } from '@/types/api';

export class AuthService {
  static async loginAdmin(username: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/admin/login', {
      username,
      password,
    });

    if (response.success && response.data) {
      const data = response.data as any;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  }

  static async loginCashier(cashier_code: string, pin: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/cashier/login', {
      cashier_code,
      pin,
    });

    if (response.success && response.data) {
      const data = response.data as any;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  }

  static async verify() {
    const response = await apiClient.get('/auth/verify');
    return response;
  }

  static logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  }

  static getUser() {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static getToken() {
    return localStorage.getItem('auth_token');
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static isAdmin() {
    const user = this.getUser();
    return user?.type === 'admin';
  }

  static isCashier() {
    const user = this.getUser();
    return user?.type === 'cashier';
  }

  static async updateUsername(new_username: string, password: string) {
    const response = await apiClient.put('/auth/admin/username', {
      new_username,
      password,
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update username');
    }

    return response;
  }

  static async updatePassword(current_password: string, new_password: string) {
    const response = await apiClient.put('/auth/admin/password', {
      current_password,
      new_password,
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update password');
    }

    return response;
  }
}
