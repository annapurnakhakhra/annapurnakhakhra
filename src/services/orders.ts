import { apiClient } from '../config/api';

export const orderService = {
  /**
   * Get Order Details by ID: GET /api/shop/orders/:id
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

  /**
   * Place Order Backend: POST /api/shop/orders
   */
  async placeOrder(orderPayload: any): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/orders', orderPayload);
      return response.data;
    } catch (error: any) {
      console.error('Error placing order:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Verify Razorpay Payment: POST /api/shop/orders/verify-payment
   */
  async verifyPayment(verificationPayload: any): Promise<any> {
    try {
      const response = await apiClient.post('/api/shop/orders/verify-payment', verificationPayload);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      throw error.response?.data || error;
    }
  }
};
