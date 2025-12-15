import { API_BASE_URL } from "@/config/api";

export class SettingsService {
  static async getPaymentQR(
    paymentMethod: "gcash" | "paymaya",
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/kiosk/payment-qr/${paymentMethod}`,
      );

      if (!response.ok) {
        console.error(`Failed to fetch ${paymentMethod} QR code`);
        return null;
      }

      const data = await response.json();

      if (data.success && data.data) {
        return data.data.qr_code_url;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching ${paymentMethod} QR code:`, error);
      return null;
    }
  }
}
