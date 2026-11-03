import { apiClient } from '../config/api';

export interface ShippingRatesPayload {
  address: {
    country: string;
    state: string;
    pincode: string;
    city: string;
  };
  order_amount: number;
  items: Array<{
    variant_id: number | string;
    quantity: number;
  }>;
}

export interface ValidateCouponPayload {
  code: string;
  order_amount: number;
}

export const checkoutService = {
  /**
   * Store Info: GET /api/shop/info
   */
  async getStoreInfo(): Promise<any> {
    try {
      const response = await apiClient.get('/api/shop/info');
      return response.data?.info || response.data?.data || response.data;
    } catch (error: any) {
      console.error('Error fetching store info:', error);
      return null;
    }
  },

  /**
   * Shipping Rates: POST /api/shop/shipping/rates
   */
  async getShippingRates(payload: ShippingRatesPayload): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/shipping/rates', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching shipping rates:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Validate Discount Coupon: POST /api/shop/checkout/validate-coupon
   */
  async validateCoupon(payload: ValidateCouponPayload): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/checkout/validate-coupon', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Payment Gateways: GET /api/shop/checkout/payment-gateways
   */
  async getPaymentGateways(): Promise<any> {
    try {
      const response = await apiClient.get('/api/shop/checkout/payment-gateways');
      return response.data?.gateways || response.data?.data || response.data;
    } catch (error: any) {
      console.error('Error fetching payment gateways:', error);
      return [];
    }
  },

  /**
   * Pincode Auto-Lookup (City, State, Country): GET /api/shop/pincode/:pincode
   */
  async lookupPincode(pincode: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/shop/pincode/${pincode}`);
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error(`Error looking up pincode [${pincode}]:`, error);
      return null;
    }
  },

  /**
   * Sync Abandoned Checkout (Draft): POST /api/shop/checkout/abandoned/sync
   */
  async syncAbandonedCheckout(payload: any): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/checkout/abandoned/sync', payload);
      return response.data;
    } catch (error: any) {
      console.warn('Error syncing abandoned checkout:', error);
      return null;
    }
  },

  /**
   * Recover Abandoned Session: GET /api/shop/checkout/abandoned/recover?sessionId=...
   */
  async recoverAbandonedCheckout(sessionId: string): Promise<any> {
    try {
      const response = await apiClient.get('/api/shop/checkout/abandoned/recover', {
        params: { sessionId },
      });
      return response.data;
    } catch (error: any) {
      console.warn('Error recovering abandoned session:', error);
      return null;
    }
  },

  /**
   * Initiate Gateway Payment: POST /api/shop/checkout/initiate-payment
   */
  async initiatePayment(payload: any): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/checkout/initiate-payment', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Verify Payment: POST /api/shop/checkout/verify-payment
   */
  async verifyPayment(payload: any): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/checkout/verify-payment', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Final Order Sync / Conversion: POST /api/shop/checkout/sync
   */
  async syncFinalOrder(payload: any): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/checkout/sync', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing final order:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update Abandoned Draft Status: PATCH /api/checkout/abandoned/status
   * Used to mark draft as "resolved" after successful order conversion
   * NOTE: Never delete the draft record!
   */
  async updateAbandonedCheckoutStatus(id: string | number, recoveryStatus: string = 'resolved'): Promise<any> {
    const payload = {
      id: String(id),
      recovery_status: recoveryStatus,
    };

    try {
      // Primary: PATCH <API_ROOT_URL>/checkout/abandoned/status
      const response = await apiClient.patch('/api/checkout/abandoned/status', payload);
      return response.data;
    } catch (primaryErr) {
      try {
        // Fallback: PATCH <API_SHOP_URL>/checkout/abandoned/status
        const fallbackResponse = await apiClient.patch('/api/shop/checkout/abandoned/status', payload);
        return fallbackResponse.data;
      } catch (fallbackErr) {
        console.warn('Error updating abandoned checkout status:', primaryErr, fallbackErr);
        return null;
      }
    }
  },

  /**
   * Post-Order Server Cart Clear: POST /api/shop/cart/clear
   */
  async clearCartOnServer(): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/cart/clear', {});
      return response.data;
    } catch (error: any) {
      console.warn('Error clearing cart on server:', error);
      return null;
    }
  },

  /**
   * Fetch Confirmed Order Details: GET /api/shop/orders/:id
   */
  async getOrderById(orderId: number | string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/shop/orders/${orderId}`);
      return response.data?.data || response.data?.order || response.data;
    } catch (error: any) {
      console.error(`Error fetching order detail [${orderId}]:`, error);
      throw error.response?.data || error;
    }
  },
};
