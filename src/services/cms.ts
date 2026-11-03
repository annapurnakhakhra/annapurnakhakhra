import { apiClient } from '../config/api';

export const cmsService = {
  /**
   * Get Blogs: GET /api/shop/cms/blogs
   */
  async getBlogs(): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/shop/cms/blogs');
      return response.data?.blogs || response.data?.data || response.data || [];
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      return [];
    }
  },

  /**
   * Get Blog Posts by Handle: GET /api/shop/cms/blogs/:handle?page=1
   */
  async getBlogPosts(handle = 'news', page = 1, limit = 50): Promise<any> {
    try {
      const response = await apiClient.get(`/api/shop/cms/blogs/${handle}?page=${page}&limit=${limit}`);
      return response.data?.posts || response.data?.data || response.data;
    } catch (error: any) {
      console.error(`Error fetching blog posts [${handle}]:`, error);
      return [];
    }
  },

  /**
   * Get Blog Post by Handle: GET /api/shop/cms/posts/:handle
   */
  async getBlogPostByHandle(handle: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/shop/cms/posts/${handle}`);
      return response.data?.post || response.data?.data || response.data;
    } catch (error: any) {
      console.error(`Error fetching blog post detail [${handle}]:`, error);
      return null;
    }
  }
};
