import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  cartId: string;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, variantId?: string, openDrawer?: boolean) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const defaultCartContext: CartContextType = {
  cart: [],
  cartId: '',
  isCartOpen: false,
  setIsCartOpen: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
};

const CartContext = createContext<CartContextType>(defaultCartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('annapurna_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartId] = useState<string>(() => {
    const savedId = localStorage.getItem('annapurna_cart_id');
    if (savedId) return savedId;
    const newId = 'cart_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('annapurna_cart_id', newId);
    return newId;
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('annapurna_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, variantId?: string, openDrawer = true) => {
    const matchedVariant =
      product.variants?.find((v) => String(v.id) === String(variantId)) ||
      product.variants?.[0] ||
      null;

    const selectedVariantId = matchedVariant?.id || variantId || `var_${product.id}`;
    const variantPrice = matchedVariant?.price
      ? parseFloat(String(matchedVariant.price))
      : typeof product.price === 'number'
      ? product.price
      : parseFloat(String(product.price)) || 0;

    const variantTitle = matchedVariant?.title;
    const image = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80';

    const validQty = Math.max(1, Number(quantity) || 1);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => String(item.variantId) === String(selectedVariantId));
      if (existingIndex > -1) {
        return prevCart.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: (Number(item.quantity) || 0) + validQty }
            : item
        );
      }
      return [
        ...prevCart,
        {
          id: `${product.id}_${selectedVariantId}`,
          productId: product.id,
          product_id: product.id,
          variantId: String(selectedVariantId),
          productHandle: product.handle,
          title: product.title,
          variantTitle,
          price: variantPrice,
          image,
          quantity: validQty,
          weight: variantTitle,
        },
      ];
    });

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartId,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  return context || defaultCartContext;
};
