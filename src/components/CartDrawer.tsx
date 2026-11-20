import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { trackInitiateCheckout } from '../services/analytics';
import { MegaEcomOtpModal } from './MegaEcomOtpModal';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [discount, setDiscount] = useState(0);

  const freeShippingThreshold = 599;
  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const amountLeftForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
        <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          
          {/* Cart Header */}
          <div className="p-5 border-b border-orange-100 flex items-center justify-between bg-orange-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
              <h2 className="font-bold text-lg text-orange-950 font-serif">Your Shopping Cart</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-orange-100/60 p-3.5 border-b border-orange-100">
            <div className="flex items-center justify-between text-xs font-semibold text-orange-950 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-orange-600" />
                {amountLeftForFreeShipping > 0
                  ? `Add ₹${amountLeftForFreeShipping.toFixed(0)} more for FREE SHIPPING!`
                  : '🎉 You have unlocked FREE SHIPPING!'}
              </span>
              <span>{progressToFreeShipping.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary transition-all duration-500 rounded-full"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore our crispy roasted authentic Khakhra varieties and add your favorites!
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-2xl border border-orange-100 bg-white shadow-xs hover:border-orange-200 transition-all"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-xl bg-orange-50"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.variantTitle && (
                        <span className="inline-block mt-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                          {item.variantTitle}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 block mt-0.5">₹{item.price} each</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-slate-200 transition-colors text-slate-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-slate-200 transition-colors text-slate-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-bold text-sm text-orange-950">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-orange-100 bg-white shadow-lg space-y-3">
              
              {/* COUPON CODE VALIDATION WIDGET */}
              <div className="space-y-1.5">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!couponCode.trim()) return;
                    setCouponLoading(true);
                    setCouponError('');
                    setCouponSuccess('');
                    try {
                      const { checkoutService } = await import('../services/checkout');
                      const res = await checkoutService.validateCoupon({
                        code: couponCode.trim(),
                        order_amount: subtotal,
                      });
                      if (res && (res.valid || res.success || res.discount_amount)) {
                        setCouponSuccess(`Coupon ${couponCode.toUpperCase()} applied successfully!`);
                        setDiscount(res.discount_amount || (subtotal * 0.1));
                      } else {
                        setCouponError(res?.message || 'Invalid or expired coupon code.');
                      }
                    } catch (err: any) {
                      setCouponError(err?.message || 'Could not validate coupon.');
                    } finally {
                      setCouponLoading(false);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Discount Coupon (e.g. SAVE20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="bg-[#7d4b0e] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#6b400c] transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? 'Applying...' : 'Apply'}
                  </button>
                </form>
                {couponError && <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-emerald-600 font-bold">{couponSuccess}</p>}
              </div>

              <div className="space-y-1 pt-2 border-t border-orange-100">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                    <span>Coupon Discount</span>
                    <span>- ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-extrabold text-orange-950 pt-1">
                  <span>Total Payable</span>
                  <span className="text-xl">₹{(subtotal - discount).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isAuthenticated || user
                    ? `Verified Account (${user?.first_name || 'Logged In'})`
                    : 'Protected by MegaEcom OTP Verification'}
                </span>
              </div>

              <button
                onClick={() => {
                  trackInitiateCheckout(cart, subtotal);
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full gradient-primary text-white font-bold py-3.5 rounded-2xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* MegaEcom Verified Checkout Modal */}
      <MegaEcomOtpModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
      />
    </>
  );
};
