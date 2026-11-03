import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, ShoppingBag, AlertCircle } from 'lucide-react';

export const CheckoutFailure: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const stateError = (location.state as any)?.error || '';
  const stateCode = (location.state as any)?.code || '';
  const paramError = searchParams.get('message') || searchParams.get('error') || '';
  const paramCode = searchParams.get('code') || searchParams.get('Response Code') || '';

  const errorMessage =
    stateError ||
    paramError ||
    'The payment transaction could not be completed. Your cart items are completely safe and untouched.';

  const errorCode = stateCode || paramCode;

  return (
    <div className="min-h-screen bg-[#fcfaf7] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-stone-900 font-serif">
            Payment Not Completed
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {errorMessage}
          </p>
        </div>

        {errorCode && (
          <div className="inline-block bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-rose-700">
            Error Code: {errorCode}
          </div>
        )}

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-stone-700 text-left space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#7d4b0e]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Cart Items Preserved</span>
          </div>
          <p className="text-[11px] text-stone-600">
            Your shopping cart is preserved so you don't need to choose your favorite snacks again. You can retry with the same or another payment gateway.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            to="/checkout"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#7d4b0e] hover:bg-[#6b400c] text-white font-bold px-6 py-3.5 rounded-full shadow-md transition-all active:scale-98 text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Checkout / Retry Payment</span>
          </Link>

          <Link
            to="/shop"
            className="w-full inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-6 py-3 rounded-full transition-all text-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFailure;

