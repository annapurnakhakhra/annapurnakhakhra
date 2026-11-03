import { apiClient } from '../config/api';

export interface CustomerReviewPayload {
  product_id: number | string;
  rating: number;
  title: string;
  description: string;
  images?: string[];
}

export interface GuestReviewPayload {
  product_id: number | string;
  customer_name: string;
  rating: number;
  title: string;
  description: string;
  images?: string[];
}

export const reviewsService = {
  /**
   * Get Product Reviews: GET /api/shop/reviews/product/:productId?page=1&limit=10
   */
  async getProductReviews(productId: number | string, page = 1, limit = 10): Promise<any> {
    try {
      const cleanId = String(productId).replace(/^gid:\/\/shopify\/Product\//, '').trim();
      const response = await apiClient.get(`/api/shop/reviews/product/${cleanId}?page=${page}&limit=${limit}`);
      const res = response.data;

      // Extract reviews array from all known API response structures
      if (Array.isArray(res?.data?.reviews)) {
        return res.data.reviews;
      }
      if (Array.isArray(res?.reviews)) {
        return res.reviews;
      }
      if (Array.isArray(res?.data)) {
        return res.data;
      }
      if (Array.isArray(res)) {
        return res;
      }
      return [];
    } catch (error: any) {
      console.error(`Error fetching reviews for product [${productId}]:`, error);
      return [];
    }
  },

  /**
   * Add Review as Logged-in Customer: POST /api/shop/reviews/customer
   */
  async submitCustomerReview(payload: CustomerReviewPayload): Promise<any> {
    try {
      const cleanPayload = {
        ...payload,
        product_id: typeof payload.product_id === 'string'
          ? payload.product_id.replace(/^gid:\/\/shopify\/Product\//, '').trim()
          : payload.product_id,
      };
      const response = await apiClient.post('/api/shop/reviews/customer', cleanPayload);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting customer review:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Add Review as Guest / Public: POST /api/shop/reviews
   */
  async submitGuestReview(payload: GuestReviewPayload): Promise<any> {
    try {
      const cleanPayload = {
        ...payload,
        product_id: typeof payload.product_id === 'string'
          ? payload.product_id.replace(/^gid:\/\/shopify\/Product\//, '').trim()
          : payload.product_id,
      };
      const response = await apiClient.post('/api/shop/reviews', cleanPayload);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting guest review:', error);
      throw error.response?.data || error;
    }
  }
};
