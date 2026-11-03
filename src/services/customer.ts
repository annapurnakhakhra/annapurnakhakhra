import { apiClient } from '../config/api';

export interface CustomerAddress {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  is_default?: boolean;
  isDefault?: boolean;
}

export interface CreateCustomerPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  addresses?: CustomerAddress[];
}

export interface CustomerProfilePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export const customerService = {
  /**
   * Send OTP (Authentication): POST /api/shop/auth/send-otp
   * Supports email or mobile phone (sends via WhatsApp)
   */
  async sendOtp(identifier: string | { email?: string; phone?: string; channel?: string }): Promise<any> {
    try {
      let body: any;
      if (typeof identifier === 'string') {
        const clean = identifier.trim();
        if (clean.includes('@')) {
          body = { email: clean.toLowerCase() };
        } else {
          const digits = clean.replace(/\D/g, '');
          body = { phone: digits.length > 10 ? digits.slice(-10) : digits, channel: 'whatsapp' };
        }
      } else {
        body = { channel: 'whatsapp', ...identifier };
      }
      const response = await apiClient.post('/api/shop/auth/send-otp', body);
      return response.data;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Verify OTP (Authentication): POST /api/shop/auth/verify-otp
   * Supports email or mobile phone (WhatsApp OTP)
   */
  async verifyOtp(identifier: string | { email?: string; phone?: string }, otp: string): Promise<any> {
    try {
      let body: any;
      if (typeof identifier === 'string') {
        const clean = identifier.trim();
        if (clean.includes('@')) {
          body = { email: clean.toLowerCase(), otp: otp.trim() };
        } else {
          const digits = clean.replace(/\D/g, '');
          body = { phone: digits.length > 10 ? digits.slice(-10) : digits, otp: otp.trim() };
        }
      } else {
        body = { ...identifier, otp: otp.trim() };
      }
      const response = await apiClient.post('/api/shop/auth/verify-otp', body);
      const data = response.data;
      const token =
        data?.token ||
        data?.jwt ||
        data?.userToken ||
        data?.accessToken ||
        data?.data?.token ||
        data?.data?.jwt ||
        data?.data?.accessToken;
      if (token) {
        localStorage.setItem('userToken', token);
        localStorage.setItem('annapurna_token', token);
      }
      return data;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Create Customer (Guest Checkout): POST /api/customers
   */
  async createCustomer(payload: CreateCustomerPayload): Promise<any> {
    try {
      const response = await apiClient.post('/api/customers', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error creating customer:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get Customer Profile: GET /api/shop/customer/me
   */
  async getProfile(): Promise<any> {
    try {
      const token =
        localStorage.getItem('userToken') ||
        localStorage.getItem('annapurna_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('accessToken');

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await apiClient.get('/api/shop/customer/me', { headers });
      const raw = response.data;
      return raw?.data?.customer || raw?.customer || raw?.data || raw;
    } catch (error: any) {
      console.error('Error getting customer profile:', error);
      return null;
    }
  },

  /**
   * Update Customer Profile: PUT /api/shop/customer/profile
   */
  async updateProfile(payload: CustomerProfilePayload): Promise<any> {
    try {
      const response = await apiClient.put('/api/shop/customer/profile', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get Customer Addresses: GET /api/shop/customer/addresses
   */
  async getAddresses(): Promise<CustomerAddress[]> {
    try {
      const token =
        localStorage.getItem('userToken') ||
        localStorage.getItem('annapurna_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('accessToken');

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await apiClient.get('/api/shop/customer/addresses', { headers });
      return (
        response.data?.addresses ||
        response.data?.data?.addresses ||
        response.data?.data ||
        response.data ||
        []
      );
    } catch (error: any) {
      console.error('Error getting addresses:', error);
      return [];
    }
  },

  /**
   * Add Customer Address: POST /api/shop/customer/addresses
   */
  async addAddress(address: CustomerAddress): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/customer/addresses', address);
      return response.data;
    } catch (error: any) {
      console.error('Error adding address:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update Customer Address: PUT /api/shop/customer/addresses/:id
   */
  async updateAddress(id: number | string, address: CustomerAddress): Promise<any> {
    try {
      const response = await apiClient.put(`/api/shop/customer/addresses/${id}`, address);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating address [${id}]:`, error);
      throw error.response?.data || error;
    }
  },

  /**
   * Set Default Address: PATCH /api/shop/customer/addresses/:id/default
   */
  async setDefaultAddress(id: number | string): Promise<any> {
    try {
      const response = await apiClient.patch(`/api/shop/customer/addresses/${id}/default`);
      return response.data;
    } catch (error: any) {
      console.error(`Error setting default address [${id}]:`, error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete Address: DELETE /api/shop/customer/addresses/:id
   */
  async deleteAddress(id: number | string): Promise<any> {
    try {
      const response = await apiClient.delete(`/api/shop/customer/addresses/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting address [${id}]:`, error);
      throw error.response?.data || error;
    }
  },

  /**
   * Pincode Auto-Lookup: GET /api/shop/pincode/:pincode
   */
  async lookupPincode(pincode: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/shop/pincode/${pincode}`);
      return response.data?.data || response.data;
    } catch (error: any) {
      console.warn(`Pincode lookup failed for [${pincode}]:`, error);
      return null;
    }
  }
};
