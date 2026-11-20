import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, RefreshCw, ShoppingBag, ArrowLeft, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { checkoutService } from '../services/checkout';
import { trackPurchase } from '../services/analytics';

export const CheckoutCallback: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [processing, setProcessing] = useState(true);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
    code?: string;
    orderId?: string | number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      // 1. Parse params from search and hash (gateways might return in query or fragment)
      const searchParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash ? location.hash.replace(/^#/, '') : '');

      const getParam = (key: string): string => {
        return searchParams.get(key) || hashParams.get(key) || '';
      };

      // Retrieve stored pending checkout state from sessionStorage
      let pendingCheckout: any = null;
      try {
        const stored = sessionStorage.getItem('pending_checkout');
        if (stored) {
          pendingCheckout = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Could not read pending_checkout from sessionStorage:', err);
      }

      const activeProvider = (provider || pendingCheckout?.provider || 'online').toLowerCase();
      const rawOrderId = getParam('order_id') || pendingCheckout?.draftOrderId || sessionStorage.getItem('checkout_abandoned_id');
      const paymentId = getParam('payment_id') || pendingCheckout?.payment_id;

      // Extract gateway response fields
      const statusParam = (getParam('status') || getParam('STATUS') || '').toLowerCase();
      const responseCode = getParam('Response Code') || getParam('response_code') || getParam('ResponseCode');
      const errorMessage = getParam('error_Message') || getParam('error_message') || getParam('error') || getParam('msg');
      const txnid = getParam('txnid') || getParam('ReferenceNo') || getParam('reference_no') || pendingCheckout?.txnid;
      const easepayid = getParam('easepayid');
      const uniqueRefNumber = getParam('Unique Ref Number') || getParam('unique_ref_number');
      const amount = getParam('amount') || getParam('Transaction Amount') || pendingCheckout?.total;
      const hash = getParam('hash');

      // Check for user cancellation or direct failure
      const isUserCancelled =
        statusParam === 'usercancelled' ||
        statusParam === 'cancelled' ||
        responseCode === 'E002';

      const isFailed =
        statusParam === 'failure' ||
        statusParam === 'failed' ||
        (responseCode && responseCode !== 'E000');

      if (isUserCancelled) {
        if (!isMounted) return;
        setProcessing(false);
        setErrorDetails({
          title: 'Payment Cancelled',
          message: errorMessage || 'The payment was cancelled by user. Your cart items are preserved and you can retry anytime.',
          code: responseCode || 'USER_CANCELLED',
          orderId: rawOrderId,
        });
        return;
      }

      if (isFailed && !statusParam.includes('success')) {
        if (!isMounted) return;
        setProcessing(false);
        let failureText = errorMessage;
        if (!failureText) {
          if (responseCode === 'E001') {
            failureText = 'Transaction declined by issuing bank. Please verify card details or balance.';
          } else if (responseCode) {
            failureText = `Bank rejected payment (Response Code: ${responseCode}). Please try an alternative payment method.`;
          } else {
            failureText = 'Payment failed at gateway. Your cart items remain safe in your cart.';
          }
        }
        setErrorDetails({
          title: 'Payment Failed',
          message: failureText,
          code: responseCode || statusParam.toUpperCase() || 'PAYMENT_FAILED',
          orderId: rawOrderId,
        });
        return;
      }

      // If status appears to be success (or default flow for callback)
      try {
        let verifyPayload: any = {
          provider: activeProvider,
          order_id: rawOrderId,
          payment_id: paymentId,
          amount: String(amount || ''),
        };

        if (activeProvider === 'easebuzz') {
          verifyPayload = {
            ...verifyPayload,
            status: statusParam || 'success',
            txnid,
            amount: String(amount || ''),
            firstname: pendingCheckout?.customer?.firstName || getParam('firstname'),
            email: pendingCheckout?.customer?.email || getParam('email'),
            phone: pendingCheckout?.customer?.phone || getParam('phone'),
            productinfo: getParam('productinfo') || `Order CHK-${rawOrderId}`,
            hash,
            easepayid,
          };
        } else if (activeProvider === 'icici') {
          verifyPayload = {
            ...verifyPayload,
            'Response Code': responseCode || 'E000',
            'Unique Ref Number': uniqueRefNumber || txnid || 'REF_CALLBACK',
            ReferenceNo: txnid || `TXN_${rawOrderId}`,
            'Transaction Amount': String(amount || ''),
          };
        } else if (activeProvider === 'razorpay') {
          verifyPayload = {
            ...verifyPayload,
            razorpay_order_id: getParam('razorpay_order_id'),
            razorpay_payment_id: getParam('razorpay_payment_id'),
            razorpay_signature: getParam('razorpay_signature'),
          };
        }

        const verifyRes = await checkoutService.verifyPayment(verifyPayload);

        const isVerified =
          verifyRes?.success === true ||
          verifyRes?.data?.status === 'paid' ||
          verifyRes?.data?.success === true;

        if (!isVerified) {
          const failMsg =
            verifyRes?.message ||
            'Payment verification failed or hash mismatch. Your cart has NOT been cleared.';
          if (!isMounted) return;
          setProcessing(false);
          setErrorDetails({
            title: 'Payment Verification Unsuccessful',
            message: failMsg,
            code: 'VERIFY_FAIL',
            orderId: rawOrderId,
          });
          return;
        }

        // --- STEP 4: Convert Draft into Official Order (/checkout/sync) ---
        const transactionRef =
          verifyRes?.data?.transaction_id ||
          verifyRes?.data?.reference_no ||
          easepayid ||
          uniqueRefNumber ||
          txnid ||
          `TXN_${rawOrderId}`;

        const fullCustomerName = pendingCheckout?.customerName ||
          `${pendingCheckout?.customer?.firstName || ''} ${pendingCheckout?.customer?.lastName || ''}`.trim() ||
          'Valued Customer';

        const isPartial = Boolean(pendingCheckout?.is_partial_payment);
        const grandTotalAmount = Number(pendingCheckout?.total || amount || 0);
        const advancePaid = isPartial
          ? Number(pendingCheckout?.advance_amount || pendingCheckout?.total_paid || amount || 0)
          : Number(grandTotalAmount);
        const balanceDue = isPartial ? Math.max(0, grandTotalAmount - advancePaid) : 0;

        const finalSyncPayload = {
          customerName: fullCustomerName,
          customerPhone: pendingCheckout?.customerPhone || pendingCheckout?.customer?.phone || '',
          customerEmail: pendingCheckout?.customerEmail || pendingCheckout?.customer?.email || '',
          first_name: pendingCheckout?.customer?.firstName || '',
          last_name: pendingCheckout?.customer?.lastName || '',
          abandoned_checkout_id: rawOrderId,
          abandonedCheckoutId: rawOrderId,
          abandonedSessionId: pendingCheckout?.sessionId || sessionStorage.getItem('checkout_session_id') || null,
          sessionId: pendingCheckout?.sessionId || sessionStorage.getItem('checkout_session_id') || null,
          session_id: pendingCheckout?.sessionId || sessionStorage.getItem('checkout_session_id') || null,
          items: pendingCheckout?.items || [],
          shippingAddress: pendingCheckout?.shippingAddress || {},
          subtotal: pendingCheckout?.subtotal || 0,
          discountAmount: pendingCheckout?.discountAmount || 0,
          discountCode: pendingCheckout?.discountCode || '',
          shippingAmount: pendingCheckout?.shippingAmount || 0,
          shippingMethod: pendingCheckout?.shippingMethod || 'Standard Delivery',
          total: grandTotalAmount,
          paymentMethod: isPartial ? 'partial_cod' : 'online',
          paymentProvider: activeProvider,
          paymentStatus: isPartial ? 'partially_paid' : 'paid',
          is_partial_payment: isPartial,
          total_paid: advancePaid,
          advance_amount: isPartial ? advancePaid : undefined,
          balance_due: balanceDue,
          transactionReference: transactionRef,
          device_type: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
          is_mobile: typeof window !== 'undefined' && window.innerWidth < 768,
        };

        const finalOrderRes = await checkoutService.syncFinalOrder(finalSyncPayload);

        // --- STEP 5: Resolve Abandoned Draft Status (DO NOT DELETE) ---
        if (rawOrderId) {
          await checkoutService.updateAbandonedCheckoutStatus(rawOrderId, 'resolved');
        }

        // --- STEP 6: Post-Order Cart Clear & Session Cleanup ---
        await checkoutService.clearCartOnServer();
        clearCart();
        try {
          sessionStorage.removeItem('pending_checkout');
          sessionStorage.removeItem('checkout_abandoned_id');
        } catch {
          // ignore storage clear errors
        }

        // Confetti celebration
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

        const finalOrderId =
          finalOrderRes?.data?.id ||
          finalOrderRes?.id ||
          rawOrderId;

        const cleanId = String(finalOrderId).replace(/^#/, '');

        const confirmedOrder = {
          ...(finalOrderRes?.data || {}),
          id: finalOrderId,
          order_number: finalOrderRes?.data?.order_number || `#${cleanId}`,
          total: grandTotalAmount,
          total_paid: advancePaid,
          advance_amount: isPartial ? advancePaid : undefined,
          balance_due: balanceDue,
          is_partial_payment: isPartial,
          payment_method: isPartial ? 'partial_cod' : 'online',
          financial_status: isPartial ? 'partially_paid' : 'paid',
          items: pendingCheckout?.items,
          shipping_address: pendingCheckout?.shippingAddress,
          customer: pendingCheckout?.customer,
        };

        // Fire purchase tracking
        trackPurchase(confirmedOrder);

        navigate(`/order-success/${cleanId}`, {
          replace: true,
          state: {
            orderId: cleanId,
            orderNumber: confirmedOrder.order_number,
            orderData: confirmedOrder,
          },
        });
      } catch (err: any) {
        console.error('Callback verification or order conversion error:', err);
        if (!isMounted) return;
        setProcessing(false);
        setErrorDetails({
          title: 'Unable to Complete Order Verification',
          message: err?.message || 'We could not verify your payment with the banking gateway. Your cart items are preserved.',
          code: 'VERIFICATION_ERROR',
          orderId: rawOrderId,
        });
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [provider, location.search, location.hash, navigate, clearCart]);

  if (processing) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-md max-w-md w-full space-y-5">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-[#7d4b0e] flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Verifying Payment...
            </h2>
            <p className="text-xs text-stone-500">
              Securely confirming transaction with {provider?.toUpperCase() || 'Bank Gateway'}. Please do not close or refresh this window.
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-full border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Bank Encryption Active</span>
          </div>
        </div>
      </div>
    );
  }

  // Failure View with explicit Retry Button and preserved cart
  return (
    <div className="min-h-screen bg-[#fcfaf7] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-stone-900 font-serif">
            {errorDetails?.title || 'Payment Incomplete'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {errorDetails?.message}
          </p>
        </div>

        {errorDetails?.code && (
          <div className="inline-block bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-rose-700">
            Reason Code: {errorDetails.code}
          </div>
        )}

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-stone-700 text-left space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#7d4b0e]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Your Cart is Preserved</span>
          </div>
          <p className="text-[11px] text-stone-600">
            No money has been debited, or if deducted, will be automatically refunded by your issuing bank within 3-5 working days.
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

export default CheckoutCallback;

