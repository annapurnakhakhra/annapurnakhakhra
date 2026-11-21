import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Zap } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { stripHtml } from '../utils/text';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const priceNum = typeof product.price === 'number' ? product.price : parseFloat(product.price);
  const compareAtNum = product.compareAtPrice
    ? typeof product.compareAtPrice === 'number'
      ? product.compareAtPrice
      : parseFloat(product.compareAtPrice)
    : null;

  const hasDiscount = compareAtNum && compareAtNum > priceNum;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtNum - priceNum) / compareAtNum) * 100)
    : 0;

  const isOutOfStock =
    Number(product.total_inventory) === 0 ||
    product.availableForSale === false ||
    (product.variants && product.variants.length > 0 && product.variants.every((v) => v.availableForSale === false));

  return (
    <div className="bg-white/90 backdrop-blur-md border border-amber-200/60 hover:shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden p-2.5 sm:p-3 group flex flex-col justify-between h-full transition-all duration-300">

      {/* IMAGE CONTAINER */}
      <div className="relative h-[150px] sm:h-[180px] md:h-[240px] overflow-hidden rounded-xl sm:rounded-2xl bg-amber-50/50">
        {isOutOfStock ? (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-rose-700/90 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full z-10 shadow-md uppercase tracking-wider backdrop-blur-xs">
            Out of Stock
          </span>
        ) : hasDiscount ? (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full z-10 shadow-sm">
            {discountPercent}% OFF
          </span>
        ) : null}

        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 p-1.5 sm:p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-slate-600"
              }`}
          />
        </button>

        <Link to={`/product/${product.handle}`}>
          <img
            src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80'}
            alt={product.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'opacity-70 grayscale-[25%]' : ''}`}
          />
        </Link>
      </div>

      {/* CONTENT */}
      <div className="pt-2 sm:pt-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
            <div className="flex text-amber-400">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-800">{product.rating || 4.9}</span>
            <span className="text-[10px] sm:text-xs text-slate-400">({product.reviewsCount || 48})</span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.handle}`}>
            <h3 className="font-bold text-xs sm:text-sm md:text-base text-[#7C4A0E] group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug font-serif">
              {product.title}
            </h3>
          </Link>

          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1">
            {stripHtml(product.description)}
          </p>
        </div>

        {/* Pricing & Add to Cart Button */}
        <div className="mt-3 sm:mt-4 pt-2 border-t border-amber-100 flex items-center justify-between gap-1">
          <div className="min-w-0">
            <span className="text-sm sm:text-base md:text-lg font-extrabold text-[#7C4A0E]">
              ₹{priceNum}
            </span>
            {compareAtNum && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through ml-1">₹{compareAtNum}</span>
            )}
          </div>

          {isOutOfStock ? (
            <button
              disabled
              className="bg-slate-100 text-slate-400 text-[10px] sm:text-xs font-bold py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg sm:rounded-xl cursor-not-allowed border border-slate-200 select-none whitespace-nowrap"
            >
              Out of Stock
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => addToCart(product, 1)}
                className="bg-[#7d4b0e] text-white text-[11px] sm:text-xs font-bold py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg sm:rounded-xl hover:bg-[#6b400c] transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
              >
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Add</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product, 1, product.variants?.[0]?.id, false);
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="bg-amber-100 text-[#7d4b0e] text-[11px] sm:text-xs font-bold py-1.5 px-2 sm:py-2 sm:px-2.5 rounded-lg sm:rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                title="Buy It Now"
                aria-label="Buy It Now"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500 text-[#7d4b0e]" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductCard;
