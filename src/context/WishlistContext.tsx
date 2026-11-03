import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { wishlistService } from '../services/wishlist';
import { productService } from '../services/products';
import { mapProductToUI } from '../services/mappers';

interface WishlistContextType {
  wishlist: Product[];
  isLoading: boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  openWishlist: () => void;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string | number) => Promise<void>;
  isInWishlist: (productId: string | number) => boolean;
  refreshWishlist: () => Promise<void>;
}

const defaultWishlistContext: WishlistContextType = {
  wishlist: [],
  isLoading: false,
  isWishlistOpen: false,
  setIsWishlistOpen: () => {},
  openWishlist: () => {},
  toggleWishlist: async () => {},
  removeFromWishlist: async () => {},
  isInWishlist: () => false,
  refreshWishlist: async () => {},
};

const WishlistContext = createContext<WishlistContextType>(defaultWishlistContext);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('annapurna_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('annapurna_wishlist', JSON.stringify(wishlist));
    } catch (err) {
      console.warn('Failed to save wishlist to localStorage:', err);
    }
  }, [wishlist]);

  // Enrich backend wishlist items with complete product details
  const syncWithBackend = useCallback(async () => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('annapurna_token');
    if (!token) return;

    setIsLoading(true);
    try {
      const [backendItems, allProducts] = await Promise.all([
        wishlistService.getWishlist().catch(() => []),
        productService.getAllProducts(250).catch(() => []),
      ]);

      if (Array.isArray(backendItems) && backendItems.length > 0) {
        const productMap = new Map<string, Product>();
        allProducts.forEach((p) => {
          productMap.set(String(p.id), p);
          if (p.handle) productMap.set(p.handle, p);
        });

        const enrichedList: Product[] = backendItems.map((item: any) => {
          const prodId = String(item.product_id || item.productId || item.id || '');
          // Check if item has a match in product catalog
          const catalogMatch = productMap.get(prodId);
          if (catalogMatch) {
            return {
              ...catalogMatch,
              // Keep backend wishlist record ID for deletion
              ...(item.id ? { wishlistId: item.id } : {}),
            };
          }

          // Otherwise, construct from item or nested product
          const raw = item.product || item;
          const mapped = mapProductToUI(raw);

          // Fallback property resolvers
          const title =
            raw.product_title ||
            raw.product_name ||
            raw.name ||
            raw.title ||
            item.product_title ||
            item.product_name ||
            item.title ||
            'Handcrafted Khakhra';

          const price =
            typeof raw.price === 'number'
              ? raw.price
              : raw.price?.amount
              ? Number(raw.price.amount)
              : raw.priceRange?.minVariantPrice?.amount
              ? Number(raw.priceRange.minVariantPrice.amount)
              : raw.variants?.[0]?.price?.amount
              ? Number(raw.variants[0].price.amount)
              : raw.selling_price || raw.unit_price || 85;

          return {
            ...mapped,
            id: String(prodId || mapped.id),
            title,
            price: Number(price) || 85,
            ...(item.id ? { wishlistId: item.id } : {}),
          };
        });

        // Merge with existing local products (avoid losing local offline items)
        setWishlist((currentLocal) => {
          const merged = [...enrichedList];
          currentLocal.forEach((localProd) => {
            if (!merged.some((p) => String(p.id) === String(localProd.id))) {
              merged.push(localProd);
            }
          });
          return merged;
        });
      }
    } catch (err) {
      console.error('Failed to sync backend wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch from backend when token is available or changes
  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  const toggleWishlist = async (product: Product) => {
    const exists = wishlist.some((p) => String(p.id) === String(product.id));

    if (exists) {
      // Remove
      setWishlist((prev) => prev.filter((p) => String(p.id) !== String(product.id)));
      const token = localStorage.getItem('userToken') || localStorage.getItem('annapurna_token');
      if (token) {
        try {
          const existingItem = wishlist.find((p) => String(p.id) === String(product.id));
          const deleteId = (existingItem as any)?.wishlistId || product.id;
          await wishlistService.deleteWishlistItem(deleteId);
        } catch (err) {
          console.warn('Backend wishlist remove failed, local updated:', err);
        }
      }
    } else {
      // Add
      setWishlist((prev) => [...prev, product]);
      const token = localStorage.getItem('userToken') || localStorage.getItem('annapurna_token');
      if (token) {
        try {
          await wishlistService.toggleWishlist(product.id, product.variants?.[0]?.id || null);
        } catch (err) {
          console.warn('Backend wishlist toggle failed, local updated:', err);
        }
      }
    }
  };

  const removeFromWishlist = async (productId: string | number) => {
    const existingItem = wishlist.find((p) => String(p.id) === String(productId) || (p as any)?.wishlistId === productId);
    setWishlist((prev) => prev.filter((p) => String(p.id) !== String(productId) && (p as any)?.wishlistId !== productId));

    const token = localStorage.getItem('userToken') || localStorage.getItem('annapurna_token');
    if (token) {
      try {
        const deleteId = (existingItem as any)?.wishlistId || productId;
        await wishlistService.deleteWishlistItem(deleteId);
      } catch (err) {
        console.warn('Backend wishlist item deletion failed:', err);
      }
    }
  };

  const isInWishlist = (productId: string | number) => {
    return wishlist.some((p) => String(p.id) === String(productId));
  };

  const openWishlist = () => setIsWishlistOpen(true);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        isWishlistOpen,
        setIsWishlistOpen,
        openWishlist,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        refreshWishlist: syncWithBackend,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  return context || defaultWishlistContext;
};
