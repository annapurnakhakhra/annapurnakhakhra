import React, { useEffect, useState } from 'react';
import { productService } from '../services/products';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

export const RecentlyViewedProducts: React.FC<{ currentProductId?: string }> = ({ currentProductId }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('recentlyViewed');
      const ids: string[] = stored ? JSON.parse(stored) : [];
      if (!ids || ids.length === 0) return;

      const allProducts = await productService.getAllProducts();
      const viewedProducts = ids
        .filter((id) => String(id) !== String(currentProductId))
        .map((id) => allProducts.find((p) => String(p.id) === String(id) || p.handle === id))
        .filter(Boolean) as Product[];

      setProducts(viewedProducts.slice(0, 4));
    }

    load();
  }, [currentProductId]);

  if (products.length === 0) return null;

  return (
    <section className="bg-amber-50/60 border-t border-amber-200/60 py-10 my-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold font-serif text-[#7d4b0e]">Recently Viewed Snacks</h2>
          <p className="text-xs text-slate-500">Pick up right where you left off</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;
