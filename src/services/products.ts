import { apiClient } from '../config/api';
import { mapProductToUI, normalizeImageUrl } from './mappers';
import type { Product } from '../types';

export const COLLECTION_HANDLE_ALIASES: Record<string, string> = {
  'khakhra-snack-pure-ghee': 'pure-ghee',
  'khakhra-snack-oil': 'oil',
  'farali-upwas-falahari-khakhara': 'farali-khakhra-pure-fasting-snacks',
  'farali': 'farali-khakhra-pure-fasting-snacks',
  'biscuit-bhakhri-khakhara-oil': 'biscuit-bhakhri-khakhara-oil',
  'todays-offer': 'todays-offer',
  'sugar-free-sweets': 'sugar-free-sweets',
  'holi-special-offer': 'holi-special-offer',
};

// Structured collections matching exact backend titles and handles
export const DEFAULT_COLLECTIONS = [
  {
    id: "col-1",
    title: "Khakhra Snack - Pure Ghee",
    handle: "pure-ghee",
    bgColor: "#4a1c24",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "col-2",
    title: "Khakhra Snack - Oil",
    handle: "oil",
    bgColor: "#164a38",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "col-3",
    title: "Biscuit Bhakhri Khakhara - Oil",
    handle: "biscuit-bhakhri-khakhara-oil",
    bgColor: "#4a4e28",
    image: "https://images.unsplash.com/photo-1541518763669-27fef04b14da?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "col-4",
    title: "Farali - Upwas - Falahari Khakhara",
    handle: "farali-khakhra-pure-fasting-snacks",
    bgColor: "#7f9a6d",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "col-5",
    title: "Sugar Free Sweets",
    handle: "sugar-free-sweets",
    bgColor: "#f5eedc",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "col-6",
    title: "Today's Offer",
    handle: "todays-offer",
    bgColor: "#e4be2c",
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80",
  },
];

export interface GetProductsParams {
  search?: string;
  collection_id?: string;
  limit?: number;
  offset?: number;
}

export const productService = {
  /**
   * List all products: GET /api/shop/products
   */
  async getAllProducts(params?: GetProductsParams | number): Promise<Product[]> {
    try {
      let query = '';
      if (typeof params === 'number') {
        query = `?limit=${params}`;
      } else if (params && typeof params === 'object') {
        const queryParams = new URLSearchParams();
        if (params.search?.trim()) queryParams.append('search', params.search.trim());
        if (params.collection_id) queryParams.append('collection_id', params.collection_id);
        if (params.limit) queryParams.append('limit', String(params.limit));
        if (params.offset) queryParams.append('offset', String(params.offset));
        const str = queryParams.toString();
        if (str) query = `?${str}`;
      } else {
        query = '?limit=250';
      }

      const response = await apiClient.get(`/api/shop/products${query}`);
      const raw = response.data?.products || response.data?.data || response.data?.items || response.data || [];

      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map(mapProductToUI);
      }
      return [];
    } catch (error) {
      console.error('Error fetching live products from backend:', error);
      return [];
    }
  },

  /**
   * Get product by ID or handle: GET /api/shop/products/:identifier
   */
  async getProductByIdentifier(identifier: string): Promise<Product | null> {
    try {
      const response = await apiClient.get(`/api/shop/products/${identifier}`);
      const raw = response.data?.product || response.data?.data || response.data;
      if (raw) {
        return mapProductToUI(raw);
      }
      return null;
    } catch (error) {
      console.error(`Error fetching product [${identifier}]:`, error);
      return null;
    }
  },

  /**
   * Legacy wrapper for getProductByIdentifier
   */
  async getProductByHandle(handle: string): Promise<Product | null> {
    return this.getProductByIdentifier(handle);
  },

  /**
   * Get all collections: GET /api/shop/collections
   */
  async getCollections(onlyDisplay: boolean = true): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/shop/collections');
      const raw = response.data?.collections || response.data?.data || response.data?.items || response.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        const filtered = onlyDisplay
          ? raw.filter((c) => c.is_display !== false && c.is_display !== 'false' && c.is_display !== 0)
          : raw;
        return filtered.map((c) => {
          const imgUrl = c.image?.url || c.image_url || c.featuredImage?.url || c.image || '';
          return {
            ...c,
            image: { url: normalizeImageUrl(imgUrl) },
          };
        });
      }
      return DEFAULT_COLLECTIONS;
    } catch (error) {
      console.error('Error fetching collections:', error);
      return DEFAULT_COLLECTIONS;
    }
  },

  /**
   * Get collection by handle: GET /api/shop/collections/:handle
   */
  async getCollectionByHandle(handle: string): Promise<{ collection: any; products: Product[] } | null> {
    const resolvedHandle = COLLECTION_HANDLE_ALIASES[handle] || handle;
    try {
      let response: any = null;
      try {
        response = await apiClient.get(`/api/shop/collections/${resolvedHandle}`);
      } catch (err) {
        if (resolvedHandle !== handle) {
          response = await apiClient.get(`/api/shop/collections/${handle}`).catch(() => null);
        }
      }

      if (!response) return null;

      const rawCollection = response.data?.collection || response.data?.data || response.data;
      const rawProducts = response.data?.products || rawCollection?.products || [];

      const mappedCollection = rawCollection ? {
        ...rawCollection,
        image: { url: normalizeImageUrl(rawCollection.image?.url || rawCollection.image_url || '') }
      } : null;

      const mappedProducts = Array.isArray(rawProducts) ? rawProducts.map(mapProductToUI) : [];

      return {
        collection: mappedCollection,
        products: mappedProducts,
      };
    } catch (error) {
      console.error(`Error fetching collection by handle [${handle}]:`, error);
      return null;
    }
  }
};
