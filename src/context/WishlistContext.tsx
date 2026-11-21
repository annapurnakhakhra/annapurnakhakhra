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
          const wishlistItemId = String(item.wishlist_item_id || item.wishlistItemId || item.id || '');

          // Check if item has a match in product catalog
          const catalogMatch = productMap.get(prodId);
          if (catalogMatch) {
            return {
              ...catalogMatch,
              // Keep backend wishlist record ID (wishlist_item_id) for deletion
              wishlist_item_id: wishlistItemId,
              wishlistId: wishlistItemId,
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
            wishlist_item_id: wishlistItemId,
            wishlistId: wishlistItemId,
          };
        });

        setWishlist(enrichedList);
      } else if (Array.isArray(backendItems) && backendItems.length === 0) {
        setWishlist([]);
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
    const existingIndex = wishlist.findIndex((p: any) =>
      String(p.id) === String(product.id) ||
      (p.wishlist_item_id && (product as any).wishlist_item_id && String(p.wishlist_item_id) === String((product as any).wishlist_item_id))
    );
    const exists = existingIndex > -1;

    if (exists) {
      // Remove
      const existingItem = wishlist[existingIndex];
      const wishlistItemId =
        (existingItem as any)?.wishlist_item_id ||
        (existingItem as any)?.wishlistId ||
        (product as any)?.wishlist_item_id ||
        (product as any)?.wishlistId;

      setWishlist((prev: any[]) =>
        prev.filter((p) =>
          String(p.id) !== String(product.id) &&
          (!wishlistItemId || (String(p.wishlist_item_id) !== String(wishlistItemId) && String(p.wishlistId) !== String(wishlistItemId)))
        )
      );

      const token = localStorage.getItem('userToken') || localStorage.getItem('annapurna_token');
      if (token) {
        try {
          if (wishlistItemId) {
            await wishlistService.deleteWishlistItem(wishlistItemId);
          } else {
            await wishlistService.toggleWishlist(product.id, product.variants?.[0]?.id || null);
          }
        } catch (err) {
          console.warn('Backend deleteWishlistItem failed, attempting toggle fallback:', err);
          try {
            await wishlistService.toggleWishlist(product.id, product.variants?.[0]?.id || null);
          } catch (toggleErr) {
            console.error('Wishlist toggle fallback error:', toggleErr);
          }
        }
      }
    } else {
      // Add
      setWishlist((prev) => [...prev, product]);
      const token = localStorage.getItem('userToken') || localStorage.getItem('annapurna_token');
      if (token) {
        try {
          const res = await wishlistService.toggleWishlist(product.id, product.variants?.[0]?.id || null);
          const newItemId =
            res?.data?.wishlist_item_id ||
            res?.data?.id ||
            res?.wishlist_item_id ||
            res?.id;
          if (newItemId) {
            setWishlist((prev: any[]) =>
              prev.map((p) =>
                String(p.id) === String(product.id)
                  ? { ...p, wishlist_item_id: String(newItemId), wishlistId: String(newItemId) }
                  : p
              )
            );
          }
        } catch (err) {
          console.warn('Backend wishlist toggle failed, local updated:', err);
        }
      }
    }
  };

  const removeFromWishlist = async (productIdOrWishlistId: string | number) => {
    const targetId = String(productIdOrWishlistId);

    // Find existing item by wishlist_item_id or product id
    const existingItem = wishlist.find((p: any) =>
      String(p.wishlist_item_id) === targetId ||
      String(p.wishlistId) === targetId ||
      String(p.id) === targetId ||
      String(p.product_id) === targetId
    );

    const prodId = existingItem ? String(existingItem.id) : targetId;
    const wishlistItemId =
      (existingItem as any)?.wishlist_item_id ||
      (existingItem as any)?.wishlistId ||
      (existingItem ? null : targetId);

    // Optimistically remove from state
    setWishlist((prev: any[]) =>
      prev.filter((p) =>
        String(p.id) !== prodId &&
        String(p.wishlist_item_id) !== targetId &&
        String(p.wishlistId) !== targetId
      )
    );

    const token = localStorage.getItem('userToken') || localStorage.getItem('annapurna_token');
    if (token) {
      try {
        if (wishlistItemId) {
          // Send wishlist_item_id to DELETE /api/shop/wishlist/:id
          await wishlistService.deleteWishlistItem(wishlistItemId);
        } else {
          // Fallback to toggle by product id if wishlist_item_id wasn't found
          await wishlistService.toggleWishlist(prodId, null);
        }
      } catch (err: any) {
        console.warn('Backend deleteWishlistItem failed, attempting toggle fallback:', err);
        try {
          await wishlistService.toggleWishlist(prodId, null);
        } catch (toggleErr) {
          console.error('Wishlist deletion failed on backend:', toggleErr);
        }
      }
    }
  };

  const isInWishlist = (productId: string | number) => {
    return wishlist.some((p: any) =>
      String(p.id) === String(productId) ||
      String(p.product_id) === String(productId)
    );
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
