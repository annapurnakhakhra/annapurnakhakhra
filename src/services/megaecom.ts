import { apiClient, SHOP_DOMAIN } from '../config/api';
import type {
  MegaEcomSendOtpResponse,
  MegaEcomVerifyOtpResponse,
  MegaEcomCheckVerifiedResponse,
  CustomCheckoutPayload,
  CustomCheckoutResponse,
} from '../types';

export const megaecomService = {
  /**
   * Send 6-digit OTP to customer email before checkout
   */
  async sendOtp(email: string): Promise<MegaEcomSendOtpResponse> {
    try {
      const response = await apiClient.post<MegaEcomSendOtpResponse>('/api/send-otp', {
        email,
        shop: SHOP_DOMAIN,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending OTP via MegaEcom API:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP. Please try again.',
      };
    }
  },

  /**
   * Verify customer OTP
   */
  async verifyOtp(email: string, otp: string): Promise<MegaEcomVerifyOtpResponse> {
    try {
      const response = await apiClient.post<MegaEcomVerifyOtpResponse>('/api/verify-otp', {
        email,
        otp,
        shop: SHOP_DOMAIN,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error verifying OTP via MegaEcom API:', error);
      return {
        success: false,
        verified: false,
        message: error.response?.data?.message || 'Invalid or expired OTP.',
      };
    }
  },

  /**
   * Quick check if email was verified in the last 24h
   */
  async checkVerified(email: string): Promise<boolean> {
    try {
      const response = await apiClient.post<MegaEcomCheckVerifiedResponse>('/api/check-verified', {
        email,
        shop: SHOP_DOMAIN,
      });
      return response.data.isVerified || false;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  },

  /**
   * Process custom checkout with verified email + line items
   */
  async processCustomCheckout(payload: CustomCheckoutPayload): Promise<CustomCheckoutResponse> {
    try {
      const response = await apiClient.post<CustomCheckoutResponse>('/api/custom-checkout', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error in custom checkout:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Checkout failed. Please check details and try again.',
      };
    }
  },
};
