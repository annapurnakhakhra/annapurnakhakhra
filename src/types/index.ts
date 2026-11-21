export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  availableForSale: boolean;
  inventoryQuantity?: number;
  selectedOptions?: { name: string; value: string }[];
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: number | string;
  compareAtPrice?: number | string;
  images: { url: string; altText?: string }[];
  category?: string;
  tags?: string[];
  variants?: ProductVariant[];
  rating?: number;
  reviewsCount?: number;
  total_inventory?: number;
  availableForSale?: boolean;
  wishlist_item_id?: string | number;
  wishlistId?: string | number;
}

export interface CartItem {
  id: string;
  productId?: string | number;
  product_id?: string | number;
  variantId: string;
  productHandle: string;
  title: string;
  variantTitle?: string;
  price: number;
  image: string;
  quantity: number;
  weight?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string;
}

export interface MegaEcomSendOtpResponse {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
}

export interface MegaEcomVerifyOtpResponse {
  success: boolean;
  verified: boolean;
  message?: string;
}

export interface MegaEcomCheckVerifiedResponse {
  success: boolean;
  isVerified: boolean;
}

export interface CustomCheckoutPayload {
  cartId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  shippingAddress: ShippingAddress;
  lineItems: { variant_id: string; quantity: number; price: string }[];
  paymentMethod: 'cod' | 'razorpay';
}

export interface CustomCheckoutResponse {
  success: boolean;
  orderId?: string;
  checkoutUrl?: string;
  redirectUrl?: string;
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}
