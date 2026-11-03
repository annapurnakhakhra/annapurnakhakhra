import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { productService } from '../services/products';
import { normalizeImageUrl } from '../services/mappers';
import type { Product } from '../types';

export const Wishlist: React.FC = () => {
  const { wishlist, isLoading: contextLoading, removeFromWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    productService
      .getAllProducts(250)
      .then((prods) => {
        if (mounted) {
          setCatalogProducts(prods);
          setCatalogLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setCatalogLoading(false);
      });

    refreshWishlist();

    return () => {
      mounted = false;
    };
  }, [refreshWishlist]);

  // Catalog lookup map
  const catalogMap = useMemo(() => {
    const map = new Map<string, Product>();
    catalogProducts.forEach((p) => {
      map.set(String(p.id), p);
      if (p.handle) map.set(p.handle, p);
    });
    return map;
  }, [catalogProducts]);

  // Fully resolve each wishlist item into a complete product
  const resolvedWishlist = useMemo(() => {
    return wishlist.map((item: any) => {
      const itemId = String(item.product_id || item.productId || item.id || '');
      const matched = catalogMap.get(itemId);

      if (matched) {
        return {
          ...matched,
          wishlistKey: item.id || matched.id,
        };
      }

      // Fallback extraction if not matched in catalog
      const raw = item.product || item;
      const title =
        raw.title ||
        raw.product_title ||
        raw.product_name ||
        raw.name ||
        item.title ||
        item.product_title ||
        item.product_name ||
        'Handcrafted Khakhra';

      const priceNum =
        typeof raw.price === 'number'
          ? raw.price
          : raw.price?.amount
          ? Number(raw.price.amount)
          : raw.priceRange?.minVariantPrice?.amount
          ? Number(raw.priceRange.minVariantPrice.amount)
          : raw.variants?.[0]?.price?.amount
          ? Number(raw.variants[0].price.amount)
          : raw.selling_price || raw.unit_price || 85;

      const compareAtNum =
        typeof raw.compareAtPrice === 'number'
          ? raw.compareAtPrice
          : raw.compareAtPrice?.amount
          ? Number(raw.compareAtPrice.amount)
          : raw.compare_at_price
          ? Number(raw.compare_at_price)
          : undefined;

      const rawImg =
        raw.image_url ||
        raw.image ||
        raw.featured_image ||
        (Array.isArray(raw.images) ? raw.images[0]?.url || raw.images[0] : null) ||
        item.image ||
        item.image_url;

      const imgUrl = rawImg ? normalizeImageUrl(rawImg) : 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80';

      const handle = raw.handle || raw.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const resolved: Product = {
        id: itemId,
        title,
        handle,
        description: raw.description || 'Authentic slow-roasted handcrafted Gujarati khakhra.',
        price: Number(priceNum) || 85,
        compareAtPrice: compareAtNum && compareAtNum > priceNum ? compareAtNum : undefined,
        images: [{ url: imgUrl, altText: title }],
        category: raw.category || 'Traditional Khakhra',
        rating: raw.rating || 4.9,
        reviewsCount: raw.reviewsCount || 36,
        variants: [
          {
            id: raw.variant_id || `var_${itemId}`,
            title: '200g Pack',
            price: String(priceNum),
            availableForSale: true,
          },
        ],
      };

      return {
        ...resolved,
        wishlistKey: item.id || resolved.id,
      };
    });
  }, [wishlist, catalogMap]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleRemove = async (productId: string | number) => {
    await removeFromWishlist(productId);
  };

  const isLoading = contextLoading && catalogLoading && wishlist.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-[75vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#7d4b0e] font-serif tracking-tight">
            My Saved Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {resolvedWishlist.length > 0
              ? `You have saved ${resolvedWishlist.length} item${resolvedWishlist.length > 1 ? 's' : ''} to enjoy later.`
              : 'Your favorite handmade Gujarati Khakhra snacks in one place'}
          </p>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7d4b0e] hover:text-[#6b400c] bg-amber-50 hover:bg-amber-100 px-4 py-2.5 rounded-full transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-80 bg-amber-50/50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : resolvedWishlist.length === 0 ? (
        <div className="bg-white border border-amber-200/80 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
            <Heart className="w-8 h-8 fill-rose-500/20" />
          </div>
          <h3 className="text-xl font-black text-[#7d4b0e] font-serif">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Browse our fresh, 100% roasted Khakhra collection and tap the heart icon on any flavor to save it!
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-block bg-[#7d4b0e] hover:bg-[#6b400c] text-white text-xs font-bold px-7 py-3 rounded-full transition-all shadow-md active:scale-95"
            >
              Explore Snacks
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {resolvedWishlist.map((product: any) => {
            const priceNum = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 85;
            const compareAtNum = product.compareAtPrice
              ? typeof product.compareAtPrice === 'number'
                ? product.compareAtPrice
                : parseFloat(product.compareAtPrice)
              : null;

            const hasDiscount = compareAtNum && compareAtNum > priceNum;
            const discountPercent = hasDiscount
              ? Math.round(((compareAtNum - priceNum) / compareAtNum) * 100)
              : 0;

            const isAdded = !!addedIds[product.id];
            const imageUrl =
              product.images?.[0]?.url ||
              product.image ||
              'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80';

            return (
              <div
                key={product.wishlistKey || product.id}
                className="bg-white border border-amber-200/80 rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-3.5 relative group"
              >
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(product.wishlistKey || product.id)}
                  className="absolute top-6 right-6 z-20 p-2 bg-white/95 backdrop-blur-xs rounded-full shadow-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  title="Remove from Wishlist"
                  aria-label="Remove from Wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Discount Badge */}
                {hasDiscount && (
                  <span className="absolute top-6 left-6 z-20 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}

                {/* Product Image */}
                <Link to={`/product/${product.handle}`} className="block">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-amber-50/50 relative">
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Link>

                {/* Details */}
                <div className="space-y-1">
                  <Link to={`/product/${product.handle}`} className="block group-hover:text-[#7d4b0e] transition-colors">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                      {product.title}
                    </h3>
                  </Link>

                  {/* Weight / Pack info */}
                  {product.variants?.[0]?.title && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      {product.variants[0].title}
                    </p>
                  )}

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-base font-black text-[#7d4b0e]">
                      ₹{priceNum}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through font-medium">
                        ₹{compareAtNum}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className={`w-full text-xs font-bold py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#7d4b0e] hover:bg-[#6b400c] text-white active:scale-95'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
