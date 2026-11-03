import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, MapPin, ShoppingBag, ShieldCheck } from 'lucide-react';
import { orderService } from '../services/orders';

export const OrderSuccess: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();

  // Extract order identifier from param, state, or hash fragment
  const stateData = (location.state as any)?.orderData || null;
  const stateOrderNumber = (location.state as any)?.orderNumber || '';
  const hashId = location.hash ? location.hash.replace(/^#/, '') : '';
  const rawId = paramId || (location.state as any)?.orderId || hashId || '';
  const cleanId = String(rawId).replace(/^#/, '');

  const [order, setOrder] = useState<any | null>(stateData);
  const [loading, setLoading] = useState<boolean>(!stateData && Boolean(cleanId));

  useEffect(() => {
    if (cleanId) {
      orderService
        .getOrderById(cleanId)
        .then((data) => {
          if (data) {
            setOrder(data);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch additional order details:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [cleanId]);

  const displayOrderNumber =
    order?.order_number ||
    stateOrderNumber ||
    (cleanId ? (cleanId.startsWith('#') ? cleanId : `#${cleanId}`) : '#CONFIRMED');

  const items = order?.products || order?.line_items || order?.items || [];
  const address = order?.address || order?.shipping_address || null;
  const amounts = order?.amounts || null;
  const paymentDetails = order?.payment_details || null;

  const subtotalVal = amounts?.subtotal_amount || order?.subtotal_price || order?.subtotal || '0';
  const shippingVal = amounts?.shipping_amount || order?.shipping_price || '0';
  const totalVal = amounts?.total_amount || paymentDetails?.amount || order?.total_price || order?.total || '0';

  return (
    <div className="bg-[#fcfaf7] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Badge */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
            Order Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Thank you for your purchase! Your delicious handcrafted Annapurna Khakhra order has been confirmed.
          </p>
          <div className="pt-1">
            <span className="text-xs sm:text-sm font-bold text-[#7d4b0e] bg-amber-100/80 px-4 py-1.5 rounded-full border border-amber-200/80 inline-block">
              Order Number: {displayOrderNumber}
            </span>
          </div>
        </div>

        {/* Loading placeholder if fetching from server and no state data */}
        {loading && !order && (
          <div className="bg-white border border-stone-200 rounded-3xl p-8 space-y-4 shadow-xs animate-pulse">
            <div className="h-6 bg-stone-100 rounded-md w-1/3" />
            <div className="h-20 bg-stone-50 rounded-xl" />
            <div className="h-20 bg-stone-50 rounded-xl" />
          </div>
        )}

        {/* Order Details Card */}
        {order && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="text-sm sm:text-base font-bold text-[#7d4b0e] flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-700" />
                <span>Order Summary</span>
              </h2>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                {order.financial_status || paymentDetails?.status || 'Paid / Verified'}
              </span>
            </div>

            {/* Items */}
            {items.length > 0 && (
              <div className="space-y-3 divide-y divide-stone-100">
                {items.map((item: any, idx: number) => {
                  const title = item.product_title || item.title || item.name || 'Annapurna Khakhra Pack';
                  const qty = item.quantity || 1;
                  const price = Number(item.price || item.unit_price || 0);
                  const lineTotal = item.line_total ? Number(item.line_total) : qty * price;

                  return (
                    <div key={item.id || idx} className="pt-3 first:pt-0 flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-stone-900 text-sm">{title}</h4>
                        <p className="text-stone-500">
                          Qty: {qty} {price > 0 && `× ₹${price.toFixed(2)}`}
                        </p>
                      </div>
                      <span className="font-bold text-stone-900 text-sm">
                        ₹{lineTotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Shipping Address */}
            {address && (
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 space-y-2 text-xs">
                <h3 className="font-bold text-[#7d4b0e] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-700" />
                  <span>Delivery Address</span>
                </h3>
                <p className="text-stone-800 font-semibold">
                  {address.name || `${address.first_name || ''} ${address.last_name || ''}`.trim() || 'Valued Customer'}
                </p>
                <p className="text-stone-600">
                  {address.address_line1 || address.address1}
                  {(address.address_line2 || address.address2) ? `, ${address.address_line2 || address.address2}` : ''}
                  {address.city ? `, ${address.city}` : ''}
                  {address.state || address.province ? `, ${address.state || address.province}` : ''}
                  {address.pincode || address.zip ? ` - ${address.pincode || address.zip}` : ''}
                </p>
              </div>
            )}

            {/* Pricing Summary */}
            <div className="pt-2 border-t border-stone-100 space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">₹{Number(subtotalVal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-stone-900">
                  {Number(shippingVal) === 0 ? 'FREE' : `₹${Number(shippingVal).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-stone-900 text-sm pt-2 border-t border-stone-100">
                <span>Total Amount Paid</span>
                <span className="text-[#7d4b0e] text-base">₹{Number(totalVal).toFixed(2)}</span>
              </div>
            </div>

            {/* Trust Assurance Card */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Dispatched with Care</p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Your order is prepared fresh. You will receive real-time courier tracking updates via SMS &amp; WhatsApp.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[#7d4b0e] hover:bg-[#683e0b] text-white px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default OrderSuccess;
