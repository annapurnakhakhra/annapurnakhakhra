import { apiClient } from '../config/api';

export interface ToggleWishlistPayload {
  product_id: number | string;
  variant_id?: number | string | null;
}

export const wishlistService = {
  /**
   * Get Customer Wishlist: GET /api/shop/wishlist
   */
  async getWishlist(): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/shop/wishlist');
      return response.data?.wishlist || response.data?.data || response.data?.items || response.data || [];
    } catch (error: any) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  },

  /**
   * Toggle Wishlist Item: POST /api/shop/wishlist/toggle
   */
  async toggleWishlist(productId: number | string, variantId: number | string | null = null): Promise<any> {
    try {
      const payload: ToggleWishlistPayload = {
        product_id: productId,
        variant_id: variantId,
      };
      const response = await apiClient.post('/api/shop/wishlist/toggle', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error toggling wishlist item:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete Wishlist Item by ID: DELETE /api/shop/wishlist/:id
   */
  async deleteWishlistItem(id: number | string): Promise<any> {
    try {
      const response = await apiClient.delete(`/api/shop/wishlist/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting wishlist item [${id}]:`, error);
      throw error.response?.data || error;
    }
  }
};
