import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, ShieldCheck, Truck, Plus, Minus, ArrowLeft, CheckCircle2, Heart, MapPin, Send, ChevronDown, Zap, XCircle } from 'lucide-react';
import { productService } from '../services/products';
import { reviewsService, type CustomerReviewPayload, type GuestReviewPayload } from '../services/reviews';
import { checkoutService } from '../services/checkout';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { RecentlyViewedProducts } from '../components/RecentlyViewedProducts';
import { FestiveNoticeBanner } from '../components/FestiveNoticeBanner';
import { hasHtml } from '../utils/text';
import type { Product } from '../types';

export const ProductDetail: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Wishlist state
  const isWishlisted = product?.id ? isInWishlist(product.id) : false;
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Pincode lookup state
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<any | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    description: '',
    customer_name: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  useEffect(() => {
    // Instantly scroll window to top whenever a product is selected
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (handle) {
      setLoading(true);
      productService.getProductByHandle(handle).then((data) => {
        setProduct(data);
        if (data?.variants?.[0]?.id) {
          setSelectedVariantId(data.variants[0].id);
        }
        setLoading(false);
        // Ensure scroll remains at the top after content mounts
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        // Save to recently viewed
        if (data?.id) {
          const stored = localStorage.getItem('recentlyViewed');
          const list: string[] = stored ? JSON.parse(stored) : [];
          const updated = [String(data.id), ...list.filter((id) => String(id) !== String(data.id))].slice(0, 10);
          localStorage.setItem('recentlyViewed', JSON.stringify(updated));

          setReviewsLoading(true);
          reviewsService.getProductReviews(data.id).then((res) => {
            const list = Array.isArray(res)
              ? res
              : Array.isArray((res as any)?.reviews)
              ? (res as any).reviews
              : Array.isArray((res as any)?.data?.reviews)
              ? (res as any).data.reviews
              : [];
            setReviews(list);
            setReviewsLoading(false);
          });
        }
      });
    }
  }, [handle]);

  const handlePincodeCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length < 6) {
      setPincodeError('Please enter a valid 6-digit Pincode');
      return;
    }
    setPincodeLoading(true);
    setPincodeError('');
    setPincodeResult(null);

    try {
      const res = await checkoutService.lookupPincode(pincode.trim());
      if (res && (res.city || res.district || res.state)) {
        setPincodeResult(res);
      } else {
        setPincodeError('Deliverable service active for this pincode.');
        setPincodeResult({ city: 'Verified Area', state: 'India', estimatedDays: '2-4 Business Days' });
      }
    } catch (err) {
      setPincodeResult({ city: 'Verified Area', state: 'India', estimatedDays: '2-4 Business Days' });
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product?.id) return;
    setWishlistLoading(true);
    try {
      await toggleWishlist(product);
    } catch (err) {
      console.warn('Wishlist toggle error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBuyItNow = () => {
    if (!product) return;
    addToCart(product, quantity, selectedVariant?.id || selectedVariantId, false);
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) return;
    setSubmittingReview(true);
    setReviewSuccessMsg('');

    try {
      const token = localStorage.getItem('userToken');
      if (token) {
        const payload: CustomerReviewPayload = {
          product_id: product.id,
          rating: reviewForm.rating,
          title: reviewForm.title,
          description: reviewForm.description,
        };
        await reviewsService.submitCustomerReview(payload);
      } else {
        const payload: GuestReviewPayload = {
          product_id: product.id,
          customer_name: reviewForm.customer_name || 'Valued Customer',
          rating: reviewForm.rating,
          title: reviewForm.title,
          description: reviewForm.description,
        };
        await reviewsService.submitGuestReview(payload);
      }
      setReviewSuccessMsg('Thank you! Your review has been submitted.');
      setReviewForm({ rating: 5, title: '', description: '', customer_name: '' });
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccessMsg('');
      }, 2000);
      
      // Refresh reviews
      reviewsService.getProductReviews(product.id).then((res) => {
        const list = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.reviews)
          ? (res as any).reviews
          : Array.isArray((res as any)?.data?.reviews)
          ? (res as any).data.reviews
          : [];
        setReviews(list);
      });
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <Link to="/shop" className="text-orange-600 font-semibold underline">Return to Shop</Link>
      </div>
    );
  }

  // Selected variant
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Back Link */}
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Collections</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Gallery & Wishlist */}
        <div className="space-y-4 relative">
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className="absolute top-4 right-4 z-10 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all text-rose-500"
            title="Add to Wishlist"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>

          <div className="aspect-square rounded-3xl overflow-hidden bg-orange-50/50 border border-orange-100 shadow-md">
            <img
              src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80'}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Header & Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-orange-100 text-orange-950 font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full">
                {product.category || 'Traditional'}
              </span>
              <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>
                  {reviews.length > 0
                    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
                    : (product.rating || 4.9)}
                </span>
                <span className="text-slate-400 font-normal">
                  ({reviews.length > 0 ? `${reviews.length} ${reviews.length === 1 ? 'Review' : 'Reviews'}` : `${product.reviewsCount || 48} Reviews`})
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif leading-tight">
              {product.title}
            </h1>
          </div>

          {/* Pricing & Stock (Image 2 style) */}
          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Price per pack:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-bold text-orange-950">₹{priceNum}</span>
                {compareAtNum && compareAtNum > priceNum && (
                  <span className="text-sm text-slate-400 line-through">₹{compareAtNum}</span>
                )}
              </div>
            </div>

            {isOutOfStock ? (
              <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Out of Stock
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> In Stock
              </span>
            )}
          </div>

          {/* Weight / Pack Variant Selector (Image 1 style) */}
          {product.variants && product.variants.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Weight:{' '}
                <span className="text-slate-500 font-semibold normal-case">
                  {selectedVariant?.title || '100gm'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = String(selectedVariant?.id) === String(v.id);
                  const isVOutOfStock = v.availableForSale === false || v.inventoryQuantity === 0 || (v as any).inventoryQuantity === '0';
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#7d4b0e] text-white shadow-sm ring-2 ring-[#7d4b0e]/30'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-400'
                      } ${isVOutOfStock ? 'opacity-65' : ''}`}
                    >
                      {v.title || '100gm'}
                      {isVOutOfStock && <span className="ml-1 text-[10px] text-rose-500 font-normal">(Sold Out)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Weight: <span className="text-slate-500 font-semibold normal-case">100gm</span>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#7d4b0e] text-white shadow-xs">
                  100gm
                </span>
              </div>
            </div>
          )}

          {/* Static Festive Notice Banner (Diwali Courier Service Announcement) */}
          <div className="pt-2">
            <FestiveNoticeBanner className="rounded-xl shadow-xs" />
          </div>

          {/* Actions: Quantity + Add to Cart inline, Buy It Now below (Image 1 layout, Image 2 color) */}
          <div className="space-y-3 pt-1">
            {isOutOfStock ? (
              <div className="space-y-2">
                <button
                  disabled
                  type="button"
                  className="w-full h-12 bg-slate-200 text-slate-500 font-extrabold px-6 rounded-full cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider select-none shadow-xs"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>OUT OF STOCK</span>
                </button>
                <p className="text-xs text-rose-600 font-medium text-center">
                  This product is currently out of stock. Please check back later!
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {/* Quantity Stepper (Pill shape as in Image 1) */}
                  <div className="flex items-center border border-slate-200 rounded-full h-12 bg-white px-2 shadow-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-slate-900 select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ADD TO CART Button (Image 2 Orange Color) */}
                  <button
                    type="button"
                    onClick={() => addToCart(product, quantity, selectedVariant?.id || selectedVariantId)}
                    className="flex-1 h-12 gradient-primary hover:opacity-95 text-white font-extrabold px-6 rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-98"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO CART</span>
                  </button>
                </div>

                {/* BUY IT NOW Button */}
                <button
                  type="button"
                  onClick={handleBuyItNow}
                  className="w-full h-12 bg-[#7d4b0e] hover:bg-[#6b400c] text-white font-extrabold px-6 rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-98"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>BUY IT NOW</span>
                </button>
              </>
            )}
          </div>

          {/* Description at the bottom with Read More toggle (Image 1 style) */}
          <div className="border-t border-amber-200/60 pt-5 space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#7d4b0e]">
              Description
            </h2>

            <div className="relative">
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isDescExpanded ? 'max-h-none' : 'max-h-36'
                }`}
              >
                {hasHtml(product.description) ? (
                  <div
                    className="rich-product-description text-sm text-slate-600 leading-relaxed space-y-2 [&_p]:mb-2 [&_ul]:list-none [&_ul]:p-0 [&_li]:mb-1.5 [&_strong]:font-bold [&_strong]:text-slate-800"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                )}
              </div>

              {!isDescExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7d4b0e] hover:text-[#e65100] transition-colors pt-1"
            >
              <span>{isDescExpanded ? 'Read Less' : 'Read More'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDescExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* PINCODE CHECKER WIDGET */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span>Check Delivery Pincode</span>
            </div>
            
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit Pincode (e.g. 380001)"
                maxLength={6}
                className="flex-1 px-3.5 py-2 text-sm border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={pincodeLoading}
                className="bg-[#7d4b0e] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#6b400c] transition-colors disabled:opacity-50"
              >
                {pincodeLoading ? 'Checking...' : 'Check'}
              </button>
            </form>

            {pincodeError && <p className="text-xs text-rose-600 font-medium">{pincodeError}</p>}

            {pincodeResult && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Delivery available to <strong>{pincodeResult.city || pincodeResult.district || 'Location'}</strong> ({pincodeResult.state || 'India'}). Estimated arrival: <strong>2-4 Business Days</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="border-t border-orange-100 pt-4 grid grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
              <span>MegaEcom Safe Checkouts</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Ships within 24 Hours</span>
            </div>
          </div>

        </div>

      </div>

      {/* REVIEWS & RATINGS SECTION */}
      <div className="border-t border-amber-200/60 pt-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-[#7d4b0e]">Customer Reviews & Ratings</h2>
            <p className="text-xs text-slate-500 mt-1">Real feedback from verified Annapurna Khakhra food lovers</p>
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-28 bg-amber-50/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-8 text-center space-y-3">
            <Star className="w-8 h-8 text-amber-400 mx-auto fill-amber-200" />
            <h3 className="text-base font-bold text-[#7d4b0e]">Be the First to Review!</h3>
            <p className="text-xs text-slate-500">Have you tried this Khakhra? Share your thoughts with other snack enthusiasts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev, idx) => (
              <div key={rev.id || idx} className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                      {(rev.customer_name || rev.author || rev.customerName || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rev.customer_name || rev.author || rev.customerName || 'Verified Buyer'}</h4>
                      <p className="text-[10px] text-slate-400">
                        {rev.created_at || rev.review_date
                          ? new Date(rev.created_at || rev.review_date).toLocaleDateString()
                          : 'Recent Purchase'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-amber-500 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (Number(rev.rating) || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.title && <h5 className="text-xs font-bold text-[#7d4b0e]">{rev.title}</h5>}
                <p className="text-xs text-slate-600 leading-relaxed">{rev.description || rev.body || rev.content}</p>

                {Array.isArray(rev.images) && rev.images.length > 0 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto">
                    {rev.images.map((img: string, i: number) => (
                      <img
                        key={i}
                        src={img}
                        alt="Review attachment"
                        className="w-14 h-14 object-cover rounded-xl border border-amber-100 shadow-2xs"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WRITE A REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-[#7d4b0e] font-serif">Write Your Review</h3>
              <p className="text-xs text-slate-500">Share your experience with {product.title}</p>
            </div>

            {reviewSuccessMsg ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-2xl text-center font-bold">
                {reviewSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={reviewForm.customer_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, customer_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Review Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delicious, crisp and authentic!"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Review Details</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us what you liked about the flavor, crispness, packaging..."
                    value={reviewForm.description}
                    onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 py-3 text-xs font-bold text-white bg-[#7d4b0e] rounded-xl hover:bg-[#6b400c] transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RECENTLY VIEWED PRODUCTS CAROUSEL */}
      <RecentlyViewedProducts currentProductId={product.id} />
    </div>
  );
};

