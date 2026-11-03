import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { stripHtml } from '../utils/text';
import type { Product } from '../types';

interface ProductQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductModal: React.FC<ProductQuickViewModalProps> = ({ isOpen, onClose, product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  React.useEffect(() => {
    if (product?.variants?.[0]?.id) {
      setSelectedVariantId(product.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
    setQuantity(1);
  }, [product]);

  if (!isOpen || !product) return null;

  const selectedVariant =
    product.variants?.find((v) => String(v.id) === String(selectedVariantId)) ||
    product.variants?.[0] ||
    null;

  const priceNum = selectedVariant?.price
    ? parseFloat(String(selectedVariant.price))
    : typeof product.price === 'number'
    ? product.price
    : parseFloat(String(product.price)) || 0;

  const compareAtNum = selectedVariant?.compareAtPrice
    ? parseFloat(String(selectedVariant.compareAtPrice))
    : product.compareAtPrice
    ? typeof product.compareAtPrice === 'number'
      ? product.compareAtPrice
      : parseFloat(String(product.compareAtPrice))
    : null;

  const isVariantOutOfStock =
    selectedVariant &&
    (selectedVariant.inventoryQuantity === 0 ||
      (selectedVariant as any).inventoryQuantity === '0' ||
      selectedVariant.availableForSale === false);

  const isProductOutOfStock =
    product.total_inventory === 0 ||
    (product as any).total_inventory === '0' ||
    product.availableForSale === false ||
    (product.variants && product.variants.length > 0 && product.variants.every((v) => v.availableForSale === false || v.inventoryQuantity === 0));

  const isOutOfStock = isProductOutOfStock || Boolean(isVariantOutOfStock);

  const handleViewFullDetails = () => {
    onClose();
    navigate(`/product/${product.handle}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-orange-100 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-700 bg-white/80 rounded-full shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 sm:p-8">
          {/* Product Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-amber-50/50 border border-orange-100">
            <img
              src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'}
              alt={product.title}
              className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-70 grayscale-[25%]' : ''}`}
            />
          </div>

          {/* Product Quick Info */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="bg-orange-100 text-orange-950 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block">
                {product.category || 'Handmade'}
              </span>

              <h2 className="text-xl font-extrabold text-slate-900 font-serif leading-tight">{product.title}</h2>

              <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.rating || 4.9}</span>
                <span className="text-slate-400 font-normal">(Verified Snack)</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#7d4b0e]">₹{priceNum}</span>
                  {compareAtNum && <span className="text-xs text-slate-400 line-through">₹{compareAtNum}</span>}
                </div>
                {isOutOfStock ? (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Out of Stock
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    In Stock
                  </span>
                )}
              </div>

              {/* Variants Selector */}
              {product.variants && product.variants.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Option:{' '}
                    <span className="text-slate-800 normal-case font-semibold">
                      {selectedVariant?.title}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants.map((v) => {
                      const isSelected = String(selectedVariant?.id) === String(v.id);
                      const isVOutOfStock = v.availableForSale === false || v.inventoryQuantity === 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-[#7d4b0e] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          } ${isVOutOfStock ? 'opacity-60' : ''}`}
                        >
                          {v.title}
                          {isVOutOfStock && <span className="ml-1 text-[10px] text-rose-500 font-normal">(Sold out)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1">
                {stripHtml(product.description) || 'Authentic slow-roasted traditional Gujarati Khakhra crafted with premium ingredients.'}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full bg-slate-200 text-slate-500 font-bold py-3 rounded-xl cursor-not-allowed text-xs uppercase tracking-wider select-none"
                >
                  Out of Stock
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">Qty:</span>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-2 text-slate-600 hover:bg-slate-200"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="p-2 text-slate-600 hover:bg-slate-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(product, quantity, selectedVariant?.id || undefined);
                      onClose();
                    }}
                    className="w-full bg-[#7d4b0e] text-white font-bold py-3 rounded-xl hover:bg-[#6b400c] transition-colors flex items-center justify-center gap-2 text-xs shadow-md"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart — ₹{(priceNum * quantity).toFixed(2)}</span>
                  </button>
                </>
              )}

              <button
                onClick={handleViewFullDetails}
                className="w-full text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors flex items-center justify-center gap-1"
              >
                <span>View Full Details & Reviews</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
