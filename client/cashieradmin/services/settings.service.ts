import type { KioskSetting } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class SettingsService {
  static async getAllSettings() {
    return apiClient.get<KioskSetting[]>("/admin/kiosk-settings");
  }

  static async getSetting(key: string) {
    return apiClient.get<KioskSetting>(`/admin/kiosk-settings/${key}`);
  }

  static async createSetting(data: {
    setting_key: string;
    setting_value: string;
    setting_type: "string" | "number" | "boolean" | "json";
    description?: string;
  }) {
    return apiClient.post<KioskSetting>("/admin/kiosk-settings", data);
  }

  static async updateSetting(
    key: string,
    data: {
      setting_value: string;
      description?: string;
    },
  ) {
    return apiClient.put<KioskSetting>(`/admin/kiosk-settings/${key}`, data);
  }

  static async uploadPaymentQR(formData: FormData) {
    return apiClient.postFormData("/admin/payment-qr/upload", formData);
  }

  static async getPaymentQR(paymentMethod: "gcash" | "paymaya") {
    return apiClient.get(`/kiosk/payment-qr/${paymentMethod}`);
  }

  static async getAllPaymentQR() {
    return apiClient.get<{ gcash: string | null; paymaya: string | null }>(
      "/admin/payment-qr",
    );
  }

  static async deletePaymentQR(paymentMethod: "gcash" | "paymaya") {
    return apiClient.delete(`/admin/payment-qr/${paymentMethod}`);
  }
}
