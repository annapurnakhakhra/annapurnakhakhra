import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Mail, ArrowRight, RefreshCw, Truck, CreditCard, Lock, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { megaecomService } from '../services/megaecom';
import { checkoutService } from '../services/checkout';
import { customerService, type CustomerAddress } from '../services/customer';
import type { ShippingAddress } from '../types';

interface MegaEcomOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaEcomOtpModal: React.FC<MegaEcomOtpModalProps> = ({ isOpen, onClose }) => {
  const { cart, cartId, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const token =
    localStorage.getItem('userToken') ||
    localStorage.getItem('annapurna_token') ||
    localStorage.getItem('token');
  const isUserLoggedIn = Boolean(isAuthenticated || user?.email || token);

  // Form Steps: 'email' | 'otp' | 'address' | 'success'
  const [step, setStep] = useState<'email' | 'otp' | 'address' | 'success'>('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // Resend OTP Cooldown Timer
  const [cooldown, setCooldown] = useState(0);

  // Payment Gateways & Shipping Rates state
  const [gateways, setGateways] = useState<any[]>([]);
  const [shippingRate, setShippingRate] = useState<number | null>(null);
  const [fetchingShipping, setFetchingShipping] = useState(false);

  // Saved Addresses State
  const [userAddresses, setUserAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | string | 'new'>('new');

  // Address State
  const [address, setAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    province: 'Gujarat',
    zip: '',
    country: 'India',
    phone: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [completedOrder, setCompletedOrder] = useState<{ orderId?: string; redirectUrl?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkoutService.getPaymentGateways().then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setGateways(data);
        }
      });

      if (isUserLoggedIn) {
        setStep('address');
        const userEmail = user?.email || '';
        if (userEmail) {
          setEmail(userEmail);
        }
        setAddress((prev) => ({
          ...prev,
          firstName: user?.first_name || user?.firstName || prev.firstName,
          lastName: user?.last_name || user?.lastName || prev.lastName,
          phone: user?.phone || prev.phone,
        }));

        customerService.getAddresses().then((addrs) => {
          if (Array.isArray(addrs) && addrs.length > 0) {
            setUserAddresses(addrs);
            const defaultAddr = addrs.find((a) => a.is_default || a.isDefault) || addrs[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id || 0);
              const zipVal = defaultAddr.pincode || '';
              setAddress({
                firstName: defaultAddr.first_name || defaultAddr.firstName || user?.first_name || '',
                lastName: defaultAddr.last_name || defaultAddr.lastName || user?.last_name || '',
                phone: defaultAddr.phone || user?.phone || '',
                address1: defaultAddr.address1 || defaultAddr.address_line1 || '',
                address2: defaultAddr.address2 || defaultAddr.address_line2 || '',
                city: defaultAddr.city || '',
                province: defaultAddr.state || 'Gujarat',
                zip: zipVal,
                country: defaultAddr.country || 'India',
              });
              if (zipVal) {
                handleCalculateShipping(zipVal);
              }
            }
          }
        });
      } else {
        setStep('email');
      }
    }
  }, [isOpen, isAuthenticated, user]);

  const handleCalculateShipping = async (zipCode: string) => {
    if (zipCode.length < 6) return;
    setFetchingShipping(true);
    try {
      const res = await checkoutService.getShippingRates({
        address: {
          country: address.country || 'India',
          state: address.province || 'Gujarat',
          pincode: zipCode,
          city: address.city || 'Surat',
        },
        order_amount: subtotal,
        items: cart.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      });
      if (res && typeof res.rate === 'number') {
        setShippingRate(res.rate);
      } else {
        setShippingRate(subtotal >= 599 ? 0 : 49);
      }
    } catch (err) {
      setShippingRate(subtotal >= 599 ? 0 : 49);
    } finally {
      setFetchingShipping(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  // Step 1: Check Email or Send OTP via MegaEcom API
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setMessage({ type: 'info', text: 'Checking email verification status...' });

    // Check if email was verified in last 24h
    const verifiedAlready = await megaecomService.checkVerified(email);
    if (verifiedAlready) {
      setStep('address');
      setMessage({ type: 'success', text: 'Email verified! Proceeding to shipping details.' });
      setLoading(false);
      return;
    }

    // Send OTP
    const res = await megaecomService.sendOtp(email);
    setLoading(false);

    if (res.success) {
      setStep('otp');
      setCooldown(60);
      setMessage({ type: 'success', text: res.message || 'OTP sent to your email.' });
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to send OTP.' });
    }
  };

  // Step 2: Verify OTP via MegaEcom API
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setMessage({ type: 'error', text: 'Please enter the complete OTP code.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await megaecomService.verifyOtp(email, otp);
    setLoading(false);

    if (res.success && res.verified) {
      setStep('address');
      setMessage({ type: 'success', text: 'Email verified successfully!' });
    } else {
      setMessage({ type: 'error', text: res.message || 'Invalid or expired OTP code.' });
    }
  };

  // Step 3: Custom Checkout Submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.firstName || !address.address1 || !address.phone || !address.city) {
      setMessage({ type: 'error', text: 'Please complete all required shipping fields.' });
      return;
    }

    setLoading(true);
    setMessage({ type: 'info', text: 'Creating your Shopify order via MegaEcom engine...' });

    const lineItems = cart.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price.toFixed(2),
    }));

    const resolvedEmail = email || user?.email || '';
    if (!resolvedEmail) {
      setMessage({ type: 'error', text: 'Email is required to confirm your order.' });
      setLoading(false);
      return;
    }

    const payload = {
      cartId,
      email: resolvedEmail,
      firstName: address.firstName,
      lastName: address.lastName,
      phoneNumber: address.phone,
      shippingAddress: address,
      lineItems,
      paymentMethod,
    };

    const res = await megaecomService.processCustomCheckout(payload);
    setLoading(false);

    if (res.success) {
      setCompletedOrder({ orderId: res.orderId, redirectUrl: res.redirectUrl });
      setStep('success');
      clearCart();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to place order. Please try again.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-orange-100 relative transition-all">
        {/* Modal Header */}
        <div className="gradient-primary text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif leading-tight">
                {isUserLoggedIn ? 'Express Checkout' : 'MegaEcom Verified Checkout'}
              </h2>
              <p className="text-xs text-orange-100">
                {isUserLoggedIn
                  ? `Welcome, ${user?.first_name || 'Customer'} • Complete your order`
                  : 'Direct Order Sync with Shopify & Instant OTP'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">

          {/* Status Message Notification */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium mb-5 flex items-center gap-2 ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>{message.text}</span>
            </div>
          )}

          {/* STEP 1: EMAIL INPUT */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-sm text-slate-600">
                Enter your email address to verify your account via <strong>MegaEcom OTP</strong> before completing your order.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP CODE INPUT */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Enter the 6-digit OTP code sent to <strong>{email}</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold bg-slate-50 border border-orange-200 rounded-xl py-3 text-orange-950 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Confirm OTP'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={handleSendOtp}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 disabled:text-slate-400"
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CUSTOMER SHIPPING & PAYMENT FORM */}
          {step === 'address' && (
            <form onSubmit={handlePlaceOrder} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {isUserLoggedIn ? (
                    <span>
                      Logged in: <strong className="font-bold text-emerald-950">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Customer'}</strong> ({email || user?.email})
                    </span>
                  ) : (
                    <span>Email Verified: {email}</span>
                  )}
                </span>
                {!isUserLoggedIn && (
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-emerald-700 underline font-semibold"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Saved Addresses for Logged In Customer */}
              {isUserLoggedIn && userAddresses.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      Select Delivery Address
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId('new');
                        setAddress({
                          firstName: user?.first_name || '',
                          lastName: user?.last_name || '',
                          phone: user?.phone || '',
                          address1: '',
                          address2: '',
                          city: '',
                          province: 'Gujarat',
                          zip: '',
                          country: 'India',
                        });
                      }}
                      className="text-[11px] text-orange-600 font-bold hover:underline"
                    >
                      + Add New
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {userAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id || 0);
                            const zipVal = addr.pincode || '';
                            setAddress({
                              firstName: addr.first_name || addr.firstName || user?.first_name || '',
                              lastName: addr.last_name || addr.lastName || user?.last_name || '',
                              phone: addr.phone || user?.phone || '',
                              address1: addr.address1 || addr.address_line1 || '',
                              address2: addr.address2 || addr.address_line2 || '',
                              city: addr.city || '',
                              province: addr.state || 'Gujarat',
                              zip: zipVal,
                              country: addr.country || 'India',
                            });
                            if (zipVal) handleCalculateShipping(zipVal);
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20'
                              : 'border-slate-200 bg-white hover:border-orange-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{addr.first_name} {addr.last_name}</span>
                            {(addr.is_default || addr.isDefault) && (
                              <span className="text-[10px] bg-amber-100 text-[#7d4b0e] px-2 py-0.5 rounded-full font-semibold">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-1">
                            {addr.address1 || addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">First Name *</label>
                  <input
                    type="text"
                    required
                    value={address.firstName}
                    onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Last Name</label>
                  <input
                    type="text"
                    value={address.lastName}
                    onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="House No, Building, Street"
                  value={address.address1}
                  onChange={(e) => setAddress({ ...address, address1: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">City *</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">State</label>
                  <input
                    type="text"
                    value={address.province}
                    onChange={(e) => setAddress({ ...address, province: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={address.zip}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAddress({ ...address, zip: val });
                      if (val.length === 6) {
                        handleCalculateShipping(val);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Shipping Rate Indicator */}
              <div className="text-[11px] text-slate-600 bg-amber-50 p-2 rounded-lg flex items-center justify-between border border-amber-200">
                <span>Estimated Shipping Fee:</span>
                <span className="font-bold text-[#7d4b0e]">
                  {fetchingShipping ? 'Calculating...' : shippingRate === 0 ? 'FREE Shipping' : `₹${shippingRate ?? (subtotal >= 599 ? 0 : 49)}`}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                  Select Payment Method {gateways.length > 0 && `(${gateways.length} Available)`}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-500/20'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-orange-600" />
                    <span>Cash on Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                      paymentMethod === 'razorpay'
                        ? 'border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-500/20'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span>Online (Razorpay)</span>
                  </button>
                </div>
              </div>

              {/* Order Total & Submit */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Payable:</span>
                  <span className="text-xl font-bold text-orange-950">
                    ₹{(subtotal + (shippingRate || (subtotal >= 599 ? 0 : 49))).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-primary text-white font-bold py-3 px-6 rounded-xl hover:opacity-95 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-serif">Order Placed Successfully!</h3>
              <p className="text-sm text-slate-600">
                Thank you for ordering from Annapurna Khakhra. Your order has been registered in Shopify.
              </p>

              {completedOrder?.orderId && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-mono text-slate-700">
                  Shopify Order ID: {completedOrder.orderId}
                </div>
              )}

              <button
                onClick={onClose}
                className="gradient-primary text-white font-semibold py-3 px-8 rounded-xl hover:opacity-95 transition-all shadow-md"
              >
                Continue Shopping
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
