import { apiClient } from '../config/api';

export interface CreateEnquiryPayload {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  message: string;
}

export interface EnquiryResponse {
  success: boolean;
  message: string;
  data?: {
    id?: string | number;
    store_id?: string | number;
    first_name?: string;
    last_name?: string;
    mobile?: string;
    email?: string;
    message?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
  };
}

export const enquiryService = {
  /**
   * Submit Customer Enquiry: POST /api/shop/enquiries
   *
   * Example Payload:
   * {
   *   "first_name": "John",
   *   "last_name": "Doe",
   *   "email": "john.doe@example.com",
   *   "mobile": "+919876543210",
   *   "message": "Hello, I have an inquiry regarding bulk orders and shipping."
   * }
   */
  async submitEnquiry(payload: CreateEnquiryPayload): Promise<EnquiryResponse> {
    try {
      const response = await apiClient.post<EnquiryResponse>('/api/shop/enquiries', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting enquiry:', error);
      throw error.response?.data || error;
    }
  },
};

export default enquiryService;
