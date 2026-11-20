import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Check,
  Truck,
  Banknote,
  Zap,
  Home,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Tag,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkoutService, type ShippingRatesPayload } from '../services/checkout';
import { customerService, type CustomerAddress } from '../services/customer';
import { loadRazorpayScript, loadEasebuzzScript, submitIciciForm } from '../utils/paymentSdk';
import { trackInitiateCheckout, trackPurchase } from '../services/analytics';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, subtotal, clearCart, updateQuantity, removeFromCart, setIsCartOpen } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Ensure cart drawer is closed while on checkout page
  useEffect(() => {
    setIsCartOpen(false);
  }, [setIsCartOpen]);

  // Track checkout initiation once on mount
  useEffect(() => {
    if (cart.length > 0) {
      trackInitiateCheckout(cart, subtotal);
    }
  }, []);

  // Unique session ID for abandoned checkout sync
  const [checkoutSessionId] = useState(() => {
    const existing = sessionStorage.getItem('checkout_session_id');
    if (existing) return existing;
    const newSession = `chk_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('checkout_session_id', newSession);
    return newSession;
  });

  const [syncedOrderId, setSyncedOrderId] = useState<string | number | null>(() => {
    return sessionStorage.getItem('checkout_abandoned_id') || null;
  });

  // Customer Contact Info
  const [customer, setCustomer] = useState(() => ({
    firstName: user?.first_name || user?.firstName || '',
    lastName: user?.last_name || user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  }));

  // Update customer when user auth loads
  useEffect(() => {
    if (user) {
      setCustomer((prev) => ({
        firstName: prev.firstName || user.first_name || user.firstName || '',
        lastName: prev.lastName || user.last_name || user.lastName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | string | 'new'>('new');
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('new');

  // Shipping Address
  const [shippingAddress, setShippingAddress] = useState({
    address1: '',
    address2: '',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '',
    country: 'India',
  });

  // Shipping Rates & Selected Method
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<any | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Payment Gateways & Selected Provider
  const [gateways, setGateways] = useState<any[]>([]);
  const [gatewaysLoading, setGatewaysLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  // Discounts
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Store Info
  const [storeInfo, setStoreInfo] = useState<any | null>(null);

  // Pincode lookup
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Form submission & error states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 0. Support Session Recovery (?sessionId=... or ?session_id=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const recoverySessionId = searchParams.get('sessionId') || searchParams.get('session_id');

    if (recoverySessionId) {
      checkoutService.recoverAbandonedCheckout(recoverySessionId).then((res) => {
        if (res?.data || res?.customer) {
          const data = res.data || res;
          if (data.customer) {
            setCustomer({
              firstName: data.customer.firstName || data.customer.first_name || data.customer.name?.split(' ')[0] || '',
              lastName: data.customer.lastName || data.customer.last_name || data.customer.name?.split(' ').slice(1).join(' ') || '',
              email: data.customer.email || '',
              phone: (data.customer.phone || '').replace(/\D/g, '').slice(-10),
            });
          }
          if (data.shipping_address || data.shippingAddress) {
            const addr = data.shipping_address || data.shippingAddress;
            const cleanPin = (addr.pincode || addr.zip || '').trim();
            setShippingAddress({
              address1: addr.address1 || addr.line1 || '',
              address2: addr.address2 || addr.line2 || '',
              city: addr.city || 'Surat',
              state: addr.state || 'Gujarat',
              pincode: cleanPin,
              country: addr.country || 'India',
            });
          }
          if (data.id) {
            setSyncedOrderId(data.id);
            sessionStorage.setItem('checkout_abandoned_id', String(data.id));
          }
        }
      });
    }
  }, [location.search]);

  // 1. Fetch Store Info & Payment Gateways
  useEffect(() => {
    checkoutService.getStoreInfo().then((info) => {
      if (info) setStoreInfo(info);
    });

    setGatewaysLoading(true);
    checkoutService.getPaymentGateways()
      .then((data) => {
        const gws = Array.isArray(data) ? data : [];
        setGateways(gws);
        if (gws.length > 0) {
          const first = gws.find((g: any) => g.is_active !== false) || gws[0];
          setSelectedProvider(first.provider || first.name || first.id || '');
        } else {
          setSelectedProvider('');
        }
      })
      .catch(() => {
        setGateways([]);
        setSelectedProvider('');
      })
      .finally(() => {
        setGatewaysLoading(false);
      });
  }, []);

  // 2. Fetch Customer Saved Addresses if authenticated
  useEffect(() => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('annapurna_token');
    if (token || isAuthenticated) {
      customerService.getAddresses().then((addrs) => {
        if (Array.isArray(addrs) && addrs.length > 0) {
          setSavedAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.is_default || a.isDefault) || addrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id || 0);
            setAddressMode('saved');
            const cleanPin = String(defaultAddr.pincode || '').trim();
            setShippingAddress({
              address1: defaultAddr.address1 || defaultAddr.address_line1 || '',
              address2: defaultAddr.address2 || defaultAddr.address_line2 || '',
              city: defaultAddr.city || 'Surat',
              state: defaultAddr.state || 'Gujarat',
              pincode: cleanPin,
              country: defaultAddr.country || 'India',
            });
            setCustomer((prev) => ({
              ...prev,
              firstName: defaultAddr.first_name || defaultAddr.firstName || prev.firstName,
              lastName: defaultAddr.last_name || defaultAddr.lastName || prev.lastName,
              phone: defaultAddr.phone || prev.phone,
            }));
          }
        }
      });
    }
  }, [isAuthenticated]);

  // 3. Fetch Shipping Rates dynamically
  const fetchRates = useCallback(async (pin: string, stateName: string, cityName: string) => {
    if (!pin || pin.length < 6) {
      setShippingRates([]);
      setSelectedShippingRate(null);
      return;
    }
    setShippingLoading(true);
    try {
      const payload: ShippingRatesPayload = {
        address: {
          country: shippingAddress.country || 'India',
          state: stateName || shippingAddress.state || 'Gujarat',
          pincode: pin,
          city: cityName || shippingAddress.city || 'Surat',
        },
        order_amount: subtotal,
        items: cart.map((it) => ({
          variant_id: it.variantId || it.id,
          quantity: it.quantity,
        })),
      };

      const res = await checkoutService.getShippingRates(payload);
      const ratesList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      if (ratesList.length > 0) {
        // Find the shipping rate with minimum cost
        const minRate = ratesList.reduce((min: any, cur: any) => {
          const minCost = Number(min.cost ?? 0);
          const curCost = Number(cur.cost ?? 0);
          return curCost < minCost ? cur : min;
        }, ratesList[0]);

        // When multiple shipping rates are returned, display and apply the minimum amount rate
        setShippingRates([minRate]);
        setSelectedShippingRate(minRate);
      } else {
        setShippingRates([]);
        setSelectedShippingRate(null);
      }
    } catch {
      setShippingRates([]);
      setSelectedShippingRate(null);
    } finally {
      setShippingLoading(false);
    }
  }, [cart, subtotal, shippingAddress.country, shippingAddress.state, shippingAddress.city]);

  // Recalculate shipping when pincode is 6 digits
  useEffect(() => {
    if (shippingAddress.pincode && shippingAddress.pincode.length === 6) {
      fetchRates(shippingAddress.pincode, shippingAddress.state, shippingAddress.city);
    }
  }, [shippingAddress.pincode, shippingAddress.state, shippingAddress.city, fetchRates]);

  // Auto-lookup City and State on pincode change
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setShippingAddress((prev) => ({ ...prev, pincode: clean }));

    if (clean.length < 6) {
      setShippingRates([]);
      setSelectedShippingRate(null);
    }

    if (clean.length === 6) {
      setPincodeLoading(true);
      try {
        const pinData = await checkoutService.lookupPincode(clean);
        if (pinData?.city || pinData?.district || pinData?.state) {
          const resolvedCity = pinData.city || pinData.district || shippingAddress.city;
          const resolvedState = pinData.state || shippingAddress.state;
          setShippingAddress((prev) => ({
            ...prev,
            city: resolvedCity,
            state: resolvedState,
          }));
          fetchRates(clean, resolvedState, resolvedCity);
        } else {
          fetchRates(clean, shippingAddress.state, shippingAddress.city);
        }
      } catch {
        fetchRates(clean, shippingAddress.state, shippingAddress.city);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Calculations
  const shippingCost = selectedShippingRate?.cost !== undefined
    ? Number(selectedShippingRate.cost)
    : 0;

  const discountAmount = appliedCoupon?.amount || 0;
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const gstAmount = Number((taxableAmount * 0.05).toFixed(2));
  const grandTotal = Math.max(taxableAmount + shippingCost, 0);

  // Payment Plan: "full" (100% Prepaid Online or Full COD) or "partial" (Advance Token + COD)
  // Default to Full Payment as requested
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'partial'>('full');

  // Tiered Partial Payment Calculation:
  // Above 399 -> Flat ₹100 Advance
  // 399 or below (<= 399) -> Flat ₹50 Advance
  const advanceAmount = grandTotal > 399 ? 100 : Math.min(grandTotal, 50);
  const balanceDue = Math.max(0, grandTotal - advanceAmount);
  const isPartialPayment = paymentPlan === 'partial';
  const amountToPayNow = isPartialPayment ? advanceAmount : grandTotal;

  // Filter Gateways: when partial payment is selected, only online gateways can collect the advance token
  const availableGateways = isPartialPayment
    ? gateways.filter((gw) => !String(gw.provider || gw.name || gw.id).toLowerCase().includes('cod'))
    : gateways;

  // Debounced auto-sync to abandoned checkout (1.5s debounce as required)
  useEffect(() => {
    const hasAnyField = Boolean(
      customer.firstName.trim() ||
      customer.lastName.trim() ||
      customer.email.trim() ||
      customer.phone.trim() ||
      shippingAddress.address1.trim() ||
      shippingAddress.pincode.trim()
    );

    if (!hasAnyField || cart.length === 0) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const fullCustomerName = `${customer.firstName} ${customer.lastName}`.trim() || 'Valued Customer';
        const cleanPhone = customer.phone.replace(/\D/g, '').slice(0, 10);
        const formattedPhone = cleanPhone ? `+91${cleanPhone}` : '';

        const fullStreet = [shippingAddress.address1, shippingAddress.address2].filter(Boolean).join(', ');

        const abandonedPayload = {
          sessionId: checkoutSessionId,
          first_name: customer.firstName.trim(),
          last_name: customer.lastName.trim(),
          customerName: fullCustomerName,
          customerPhone: cleanPhone || formattedPhone,
          customerEmail: customer.email.trim(),
          customer: {
            name: fullCustomerName,
            firstName: customer.firstName.trim(),
            lastName: customer.lastName.trim(),
            phone: cleanPhone || formattedPhone,
            email: customer.email.trim(),
          },
          shippingAddress: {
            name: fullCustomerName,
            line1: fullStreet || shippingAddress.address1,
            line2: shippingAddress.address2 || '',
            address1: shippingAddress.address1,
            address2: shippingAddress.address2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
            country: shippingAddress.country || 'India',
            phone: cleanPhone || formattedPhone,
            email: customer.email.trim(),
          },
          shipping_address: {
            name: fullCustomerName,
            line1: fullStreet || shippingAddress.address1,
            address1: shippingAddress.address1,
            address2: shippingAddress.address2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
            country: shippingAddress.country || 'India',
          },
          items: cart.map((it) => {
            const rawProductId = it.productId || it.product_id || (it.id ? String(it.id).split('_')[0] : '') || it.variantId;
            const numericProductId = Number(rawProductId) || rawProductId;
            const rawVariantId = it.variantId || it.id;
            const numericVariantId = Number(rawVariantId) || rawVariantId;
            return {
              productId: numericProductId,
              product_id: numericProductId,
              variantId: numericVariantId,
              variant_id: numericVariantId,
              title: it.title,
              sku: (it as any).sku || `SKU-${numericProductId}`,
              price: Number(it.price),
              quantity: it.quantity,
            };
          }),
          shipping_method: selectedShippingRate?.name || 'Standard Shipping',
          shippingMethod: selectedShippingRate?.name || 'Standard Shipping',
          subtotal,
          discountAmount,
          discount_amount: discountAmount,
          discountCode: appliedCoupon?.code || '',
          shippingAmount: shippingCost,
          shipping_amount: shippingCost,
          tax: gstAmount,
          total: grandTotal,
          currency: 'INR',
          stage: 'one_step_checkout',
          device_type: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
          is_mobile: typeof window !== 'undefined' && window.innerWidth < 768,
        };

        const syncRes = await checkoutService.syncAbandonedCheckout(abandonedPayload);
        const orderId = syncRes?.data?.id || syncRes?.id;
        if (orderId) {
          setSyncedOrderId(orderId);
          sessionStorage.setItem('checkout_abandoned_id', String(orderId));
        }
      } catch (err) {
        console.warn('Debounced abandoned checkout sync error:', err);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [
    checkoutSessionId,
    customer.firstName,
    customer.lastName,
    customer.email,
    customer.phone,
    shippingAddress.address1,
    shippingAddress.address2,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.pincode,
    shippingAddress.country,
    selectedShippingRate,
    shippingCost,
    discountAmount,
    subtotal,
    gstAmount,
    grandTotal,
    cart,
    appliedCoupon?.code,
  ]);

  // Apply Coupon Code
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const code = couponInput.trim().toUpperCase();
      const res = await checkoutService.validateCoupon({
        code,
        order_amount: subtotal,
      });

      if (res && (res.valid || res.success || res.discount_amount || res.data?.discount_amount)) {
        const amt = Number(res.data?.discount_amount || res.discount_amount) || Math.round(subtotal * 0.1);
        setAppliedCoupon({ code, amount: amt });
        setCouponMsg({ type: 'success', text: res.message || `Coupon ${code} applied successfully!` });
        setCouponInput('');
      } else {
        setCouponMsg({ type: 'error', text: res?.message || 'Invalid or expired coupon code' });
      }
    } catch (err: any) {
      setCouponMsg({ type: 'error', text: err?.message || 'Could not validate coupon code' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMsg(null);
  };

  // Select Saved Address
  const handleSelectSavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id || 0);
    setAddressMode('saved');
    const cleanPin = String(addr.pincode || '').trim();
    setShippingAddress({
      address1: addr.address1 || addr.address_line1 || '',
      address2: addr.address2 || addr.address_line2 || '',
      city: addr.city || 'Surat',
      state: addr.state || 'Gujarat',
      pincode: cleanPin,
      country: addr.country || 'India',
    });
    setCustomer((prev) => ({
      ...prev,
      firstName: addr.first_name || addr.firstName || prev.firstName,
      lastName: addr.last_name || addr.lastName || prev.lastName,
      phone: addr.phone || prev.phone,
    }));
    if (cleanPin.length === 6) {
      fetchRates(cleanPin, addr.state || 'Gujarat', addr.city || 'Surat');
    }
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId('new');
    setAddressMode('new');
    setShippingAddress({
      address1: '',
      address2: '',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '',
      country: 'India',
    });
  };

  /**
   * Phase 3, 4, 5: Official Order Conversion, Resolve Draft, and Clear Cart
   */
  const completeOrderAndCleanup = async (
    abandonedOrderId: string | number,
    fullCustomerName: string,
    formattedPhone: string,
    paymentMethod: 'online' | 'cod' | 'partial_cod',
    paymentProvider: string,
    paymentStatus: 'paid' | 'pending' | 'partially_paid',
    transactionReference: string,
    extraPartialData?: {
      is_partial_payment?: boolean;
      total_paid?: number;
      advance_amount?: number;
      balance_due?: number;
    }
  ) => {
    const fullStreet = [shippingAddress.address1, shippingAddress.address2].filter(Boolean).join(', ');

    const isPartial = Boolean(extraPartialData?.is_partial_payment ?? isPartialPayment);
    const finalTotalPaid = extraPartialData?.total_paid !== undefined
      ? extraPartialData.total_paid
      : (isPartial ? advanceAmount : (paymentStatus === 'paid' ? grandTotal : 0));
    const finalAdvanceAmount = extraPartialData?.advance_amount !== undefined
      ? extraPartialData.advance_amount
      : (isPartial ? advanceAmount : undefined);
    const finalBalanceDue = extraPartialData?.balance_due !== undefined
      ? extraPartialData.balance_due
      : (isPartial ? balanceDue : 0);

    // 1. Phase 3: POST /checkout/sync
    const syncFinalPayload: any = {
      customerName: fullCustomerName,
      customerPhone: formattedPhone,
      customerEmail: customer.email.trim(),
      first_name: customer.firstName.trim(),
      last_name: customer.lastName.trim(),
      abandoned_checkout_id: abandonedOrderId,
      abandonedCheckoutId: abandonedOrderId,
      abandonedSessionId: checkoutSessionId,
      sessionId: checkoutSessionId,
      session_id: checkoutSessionId,
      items: cart.map((it) => {
        const rawProductId = it.productId || it.product_id || (it.id ? String(it.id).split('_')[0] : '') || it.variantId;
        const numericProductId = Number(rawProductId) || rawProductId;
        const rawVariantId = it.variantId || it.id;
        const numericVariantId = Number(rawVariantId) || rawVariantId;
        return {
          productId: numericProductId,
          variantId: numericVariantId,
          title: it.title,
          sku: (it as any).sku || `SKU-${numericProductId}`,
          price: Number(it.price),
          quantity: it.quantity,
        };
      }),
      shippingAddress: {
        name: fullCustomerName,
        line1: fullStreet || shippingAddress.address1,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || 'India',
        phone: formattedPhone,
        email: customer.email.trim(),
      },
      subtotal,
      discountAmount,
      discountCode: appliedCoupon?.code || '',
      shippingAmount: shippingCost,
      shippingMethod: selectedShippingRate?.name || 'Standard Delivery',
      total: grandTotal,
      paymentMethod,
      paymentProvider,
      paymentStatus,
      is_partial_payment: isPartial,
      total_paid: finalTotalPaid,
      advance_amount: finalAdvanceAmount,
      balance_due: finalBalanceDue,
      transactionReference,
      device_type: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
      is_mobile: typeof window !== 'undefined' && window.innerWidth < 768,
    };

    let finalOrderResult: any = null;
    try {
      finalOrderResult = await checkoutService.syncFinalOrder(syncFinalPayload);
    } catch (syncErr) {
      console.warn('Final checkout sync error:', syncErr);
    }

    // 2. Phase 4: PATCH /checkout/abandoned/status (Mark draft as "resolved" - NEVER DELETE)
    if (abandonedOrderId) {
      try {
        await checkoutService.updateAbandonedCheckoutStatus(abandonedOrderId, 'resolved');
      } catch (statusErr) {
        console.warn('Could not update abandoned status:', statusErr);
      }
    }

    // 3. Phase 5: POST /cart/clear, clear storage, fire confetti, navigate to success
    try {
      await checkoutService.clearCartOnServer();
    } catch {
      // ignore
    }

    clearCart();
    try {
      sessionStorage.removeItem('pending_checkout');
      sessionStorage.removeItem('checkout_abandoned_id');
    } catch {
      // ignore
    }

    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    const rawOrderNumber =
      finalOrderResult?.data?.order_number ||
      finalOrderResult?.data?.id ||
      abandonedOrderId;
    const cleanId = String(finalOrderResult?.data?.id || rawOrderNumber).replace(/^#/, '');

    const confirmedOrderData = {
      ...(finalOrderResult?.data || {}),
      id: finalOrderResult?.data?.id || cleanId,
      order_number: finalOrderResult?.data?.order_number || `#${cleanId}`,
      total: grandTotal,
      total_paid: finalTotalPaid,
      advance_amount: finalAdvanceAmount,
      balance_due: finalBalanceDue,
      is_partial_payment: isPartial,
      payment_method: paymentMethod,
      financial_status: paymentStatus,
      items: cart,
      shipping_address: shippingAddress,
      customer,
    };

    // Fire purchase tracking
    trackPurchase(confirmedOrderData);

    navigate(`/order-success/${cleanId}`, {
      state: {
        orderId: cleanId,
        orderNumber: confirmedOrderData.order_number,
        orderData: confirmedOrderData,
      },
    });
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    setErrorMessage('');

    // Validation
    if (!customer.firstName.trim()) {
      setErrorMessage('Please enter your First Name.');
      return;
    }
    if (!customer.email.trim() || !customer.email.includes('@')) {
      setErrorMessage('Please enter a valid Email Address.');
      return;
    }
    const cleanPhone = customer.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Mobile Phone Number.');
      return;
    }
    if (!shippingAddress.address1.trim()) {
      setErrorMessage('Please enter your Delivery Street Address.');
      return;
    }
    if (!shippingAddress.pincode || shippingAddress.pincode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Pincode.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (shippingRates.length === 0) {
      setErrorMessage('No delivery method is available from the API for this address/pincode.');
      return;
    }

    if (!selectedShippingRate) {
      setErrorMessage('Please select a delivery speed & method.');
      return;
    }

    if (gateways.length === 0) {
      setErrorMessage('No payment method is available from the API to complete this order.');
      return;
    }

    if (!selectedProvider) {
      setErrorMessage('Please select a payment method.');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const fullCustomerName = `${customer.firstName} ${customer.lastName}`.trim() || 'Valued Customer';
      const formattedPhone = cleanPhone;
      const fullStreet = [shippingAddress.address1, shippingAddress.address2].filter(Boolean).join(', ');

      // 1. Sync Abandoned Checkout session to get real draft order_id from API
      const abandonedPayload = {
        sessionId: checkoutSessionId,
        first_name: customer.firstName.trim(),
        last_name: customer.lastName.trim(),
        customerName: fullCustomerName,
        customerPhone: formattedPhone,
        customerEmail: customer.email.trim(),
        customer: {
          name: fullCustomerName,
          firstName: customer.firstName.trim(),
          lastName: customer.lastName.trim(),
          phone: formattedPhone,
          email: customer.email.trim(),
        },
        shippingAddress: {
          name: fullCustomerName,
          line1: fullStreet || shippingAddress.address1,
          line2: shippingAddress.address2 || '',
          address1: shippingAddress.address1,
          address2: shippingAddress.address2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
          country: shippingAddress.country || 'India',
          phone: formattedPhone,
          email: customer.email.trim(),
        },
        items: cart.map((it) => {
          const rawProductId = it.productId || it.product_id || (it.id ? String(it.id).split('_')[0] : '') || it.variantId;
          const numericProductId = Number(rawProductId) || rawProductId;
          const rawVariantId = it.variantId || it.id;
          const numericVariantId = Number(rawVariantId) || rawVariantId;
          return {
            productId: numericProductId,
            variantId: numericVariantId,
            title: it.title,
            sku: (it as any).sku || `SKU-${numericProductId}`,
            price: Number(it.price),
            quantity: it.quantity,
          };
        }),
        subtotal,
        discountAmount,
        discountCode: appliedCoupon?.code || '',
        shippingAmount: shippingCost,
        shippingMethod: selectedShippingRate?.name || 'Standard Delivery',
        total: grandTotal,
        currency: 'INR',
        stage: 'one_step_checkout',
        device_type: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
        is_mobile: typeof window !== 'undefined' && window.innerWidth < 768,
      };

      const syncRes = await checkoutService.syncAbandonedCheckout(abandonedPayload);
      const activeOrderId = syncRes?.data?.id || syncRes?.id || syncedOrderId;

      if (!activeOrderId) {
        throw new Error('Unable to create checkout session. Please check your network and try again.');
      }
      setSyncedOrderId(activeOrderId);
      sessionStorage.setItem('checkout_abandoned_id', String(activeOrderId));

      // Provider normalization
      const normProvider = selectedProvider.toLowerCase();
      const returnUrl = `${window.location.origin}/checkout/callback/${normProvider}`;

      // Save pending checkout snapshot to sessionStorage
      const pendingSnapshot = {
        draftOrderId: activeOrderId,
        provider: normProvider,
        customerName: fullCustomerName,
        customerPhone: formattedPhone,
        customerEmail: customer.email.trim(),
        customer: {
          firstName: customer.firstName.trim(),
          lastName: customer.lastName.trim(),
          email: customer.email.trim(),
          phone: formattedPhone,
        },
        shippingAddress: {
          name: fullCustomerName,
          line1: fullStreet || shippingAddress.address1,
          line2: shippingAddress.address2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
          country: shippingAddress.country || 'India',
        },
        items: abandonedPayload.items,
        subtotal,
        discountAmount,
        discountCode: appliedCoupon?.code || '',
        shippingAmount: shippingCost,
        shippingMethod: selectedShippingRate?.name || 'Standard Delivery',
        total: grandTotal,
        is_partial_payment: isPartialPayment,
        advance_amount: isPartialPayment ? advanceAmount : undefined,
        balance_due: isPartialPayment ? balanceDue : 0,
        total_paid: isPartialPayment ? advanceAmount : grandTotal,
        sessionId: checkoutSessionId,
      };
      sessionStorage.setItem('pending_checkout', JSON.stringify(pendingSnapshot));

      // 2. Handle Cash on Delivery (COD)
      if (normProvider.includes('cod')) {
        await completeOrderAndCleanup(
          activeOrderId,
          fullCustomerName,
          formattedPhone,
          'cod',
          'cod',
          'pending',
          'COD'
        );
        setIsPlacingOrder(false);
        return;
      }

      // 3. Initiate Online Payment: POST /checkout/initiate-payment
      const initPayload = {
        order_id: activeOrderId,
        provider: normProvider,
        amount: amountToPayNow,
        is_partial_payment: isPartialPayment,
        advance_amount: isPartialPayment ? advanceAmount : undefined,
        balance_due: isPartialPayment ? balanceDue : 0,
        productinfo: `Order CHK-${activeOrderId}`,
        return_url: returnUrl,
        customer: {
          name: fullCustomerName,
          firstName: customer.firstName.trim(),
          lastName: customer.lastName.trim(),
          email: customer.email.trim(),
          phone: formattedPhone,
        },
        firstname: customer.firstName.trim(),
        lastname: customer.lastName.trim(),
        email: customer.email.trim(),
        phone: formattedPhone,
      };

      const initRes = await checkoutService.initiatePayment(initPayload);
      const initData = initRes?.data || initRes;

      // Update pending snapshot with payment_id / txnid returned by API
      pendingSnapshot.total = initData.amount || grandTotal;
      (pendingSnapshot as any).payment_id = initData.payment_id;
      (pendingSnapshot as any).txnid = initData.txnid;
      sessionStorage.setItem('pending_checkout', JSON.stringify(pendingSnapshot));

      // 4. Handle Gateway Specific Logic
      if (normProvider === 'easebuzz') {
        const loaded = await loadEasebuzzScript();
        if (loaded && (window as any).EasebuzzCheckout && (initData.key || initData.access_key)) {
          const env = initData.is_test_mode ? 'test' : 'prod';
          const easebuzzCheckout = new (window as any).EasebuzzCheckout(initData.key || '2PBP7IABZ2', env);
          const options = {
            access_key: initData.access_key,
            onResponse: async (response: any) => {
              if (response.status === 'success') {
                try {
                  setIsPlacingOrder(true);
                  const verifyPayload = {
                    provider: 'easebuzz',
                    order_id: activeOrderId,
                    payment_id: initData.payment_id,
                    status: 'success',
                    txnid: response.txnid || initData.txnid,
                    amount: String(amountToPayNow),
                    firstname: customer.firstName.trim(),
                    email: customer.email.trim(),
                    phone: formattedPhone,
                    productinfo: `Order CHK-${activeOrderId}`,
                    hash: response.hash,
                    easepayid: response.easepayid,
                  };

                  const verifyRes = await checkoutService.verifyPayment(verifyPayload);
                  if (verifyRes?.success || verifyRes?.data?.status === 'paid') {
                    await completeOrderAndCleanup(
                      activeOrderId,
                      fullCustomerName,
                      formattedPhone,
                      isPartialPayment ? 'partial_cod' : 'online',
                      'easebuzz',
                      isPartialPayment ? 'partially_paid' : 'paid',
                      response.easepayid || response.txnid,
                      {
                        is_partial_payment: isPartialPayment,
                        advance_amount: advanceAmount,
                        total_paid: advanceAmount,
                        balance_due: balanceDue,
                      }
                    );
                  } else {
                    setErrorMessage(verifyRes?.message || 'Payment verification failed. Cart preserved.');
                  }
                } catch (verifyErr: any) {
                  setErrorMessage(verifyErr?.message || 'Payment verification failed. Your cart is preserved.');
                } finally {
                  setIsPlacingOrder(false);
                }
              } else {
                // Strict Rule: Never clear cart or resolve draft on failure / cancellation
                setIsPlacingOrder(false);
                const failReason = response.error_Message ||
                  (response.status === 'usercancelled' ? 'Transaction was cancelled by user.' : 'Payment failed at gateway.');
                setErrorMessage(`${failReason} Your cart items are preserved.`);
              }
            },
          };
          easebuzzCheckout.initiatePayment(options);
          setIsPlacingOrder(false);
        } else if (initData.checkout_url || initData.payment_url) {
          window.location.href = initData.checkout_url || initData.payment_url;
        } else {
          throw new Error('Easebuzz checkout access key or URL missing from backend response.');
        }
      } else if (normProvider === 'icici') {
        if (initData.service_url && initData.form_payload) {
          submitIciciForm(initData.service_url, initData.form_payload);
          // Browser will redirect to ICICI EazyPG, then return to /checkout/callback/icici
        } else if (initData.payment_url || initData.checkout_url) {
          window.location.href = initData.payment_url || initData.checkout_url;
        } else {
          throw new Error('ICICI Eazypay service URL or form payload missing from backend response.');
        }
      } else if (normProvider === 'razorpay') {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay payment SDK. Please check your internet connection.');
        }

        const expectedPaise = Math.round(amountToPayNow * 100);
        const rzpOptions = {
          key: initData.key_id,
          amount: initData.amount || expectedPaise,
          currency: initData.currency || 'INR',
          name: storeInfo?.name || 'Annapurna Khakhra Store',
          description: `Order CHK-${activeOrderId}`,
          order_id: initData.razorpay_order_id,
          prefill: {
            name: initData.customer_name || fullCustomerName,
            email: initData.customer_email || customer.email.trim(),
            contact: initData.customer_phone || formattedPhone,
          },
          theme: {
            color: '#7d4b0e',
          },
          handler: async (response: any) => {
            try {
              setIsPlacingOrder(true);
              const verifyPayload = {
                provider: 'razorpay',
                order_id: activeOrderId,
                payment_id: initData.payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              };

              const verifyRes = await checkoutService.verifyPayment(verifyPayload);
              if (verifyRes?.success || verifyRes?.data?.success) {
                await completeOrderAndCleanup(
                  activeOrderId,
                  fullCustomerName,
                  formattedPhone,
                  isPartialPayment ? 'partial_cod' : 'online',
                  'razorpay',
                  isPartialPayment ? 'partially_paid' : 'paid',
                  response.razorpay_payment_id,
                  {
                    is_partial_payment: isPartialPayment,
                    advance_amount: advanceAmount,
                    total_paid: advanceAmount,
                    balance_due: balanceDue,
                  }
                );
              } else {
                setErrorMessage(verifyRes?.message || 'Payment verification failed. Your cart is preserved.');
              }
            } catch (verifyErr: any) {
              setErrorMessage(verifyErr?.message || 'Payment verification failed. Your cart is preserved.');
            } finally {
              setIsPlacingOrder(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsPlacingOrder(false);
              setErrorMessage('Payment window was closed. Your cart is preserved, you can retry anytime.');
            },
          },
        };

        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.on('payment.failed', (failRes: any) => {
          setIsPlacingOrder(false);
          setErrorMessage(failRes?.error?.description || 'Payment failed. Cart preserved.');
        });
        rzp.open();
        setIsPlacingOrder(false);
      } else {
        // Generic gateway or direct checkout URL
        if (initData.payment_url || initData.checkout_url) {
          window.location.href = initData.payment_url || initData.checkout_url;
        } else {
          await completeOrderAndCleanup(
            activeOrderId,
            fullCustomerName,
            formattedPhone,
            isPartialPayment ? 'partial_cod' : 'online',
            normProvider,
            isPartialPayment ? 'partially_paid' : 'paid',
            initData.transaction_id || `TXN_${activeOrderId}`,
            {
              is_partial_payment: isPartialPayment,
              advance_amount: advanceAmount,
              total_paid: isPartialPayment ? advanceAmount : grandTotal,
              balance_due: isPartialPayment ? balanceDue : 0,
            }
          );
          setIsPlacingOrder(false);
        }
      }
    } catch (err: any) {
      console.error('Order placement error:', err);
      setErrorMessage(err?.message || 'Failed to complete checkout. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-[#7d4b0e] border border-amber-200">
          <Truck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-serif">Your Cart is Empty</h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Add your favorite authentic Gujarati Khakhra packs to your cart before proceeding to checkout.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-[#7d4b0e] hover:bg-[#6b400c] text-white font-bold px-8 py-3.5 rounded-full shadow-md transition-all"
        >
          <span>Explore Products</span>
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfaf7] min-h-screen pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#7d4b0e] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Shopping</span>
          </button>
        </div>

        {/* Global Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Checkout Notice:</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-600 hover:text-rose-800 text-xs font-bold underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: 3-STEP CHECKOUT FORM */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* STEP 1: CUSTOMER CONTACT & IDENTITY */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-7 shadow-xs">
              <div className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 mb-6">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-[#7d4b0e] border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                    1
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-tight">
                      Customer Contact &amp; Identity
                    </h2>
                    <p className="text-[11px] sm:text-xs text-stone-500 font-sans mt-0.5 leading-snug">
                      Provide your details for order confirmation receipts &amp; dispatch tracking.
                    </p>
                  </div>
                </div>

                {!isAuthenticated && !user && (
                  <Link
                    to="/login?redirect=/checkout"
                    className="shrink-0 whitespace-nowrap text-xs font-bold text-[#7d4b0e] hover:text-[#5d3709] bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#7d4b0e] shrink-0" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>

              {/* Logged in member badge */}
              {(isAuthenticated || user) && (
                <div className="mb-6 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#7d4b0e] text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
                      {(user?.first_name || customer.firstName || 'D')[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">
                        Logged in as {user?.first_name || customer.firstName} {user?.last_name || customer.lastName}
                      </p>
                      <p className="text-[11px] text-stone-500">{user?.email || customer.email}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    Verified Member
                  </span>
                </div>
              )}

              {/* Customer Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter first name"
                    value={customer.firstName}
                    onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                    className="w-full bg-slate-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter last name"
                    value={customer.lastName}
                    onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                    className="w-full bg-slate-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full bg-slate-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]/30 transition-all"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Invoices &amp; order updates sent here</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full bg-slate-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]/30 transition-all"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">10-digit number for delivery agent call &amp; tracking</p>
                </div>
              </div>
            </div>

            {/* STEP 2: SHIPPING & DELIVERY DESTINATION */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-[#7d4b0e] border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                    2
                  </div>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-tight">
                      Shipping &amp; Delivery Destination
                    </h2>
                    <p className="text-[11px] sm:text-xs text-stone-500 font-sans mt-0.5">
                      Select a saved address or enter a delivery destination.
                    </p>
                  </div>
                </div>
              </div>

              {/* Saved Addresses Grid */}
              {(isAuthenticated || user) && savedAddresses.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
                    YOUR SAVED ADDRESSES
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id && addressMode === 'saved';
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all relative ${isSelected
                            ? 'border-[#7d4b0e] bg-amber-50/40 ring-1 ring-[#7d4b0e]'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5 text-stone-500" />
                              <span>{addr.first_name || addr.firstName} {addr.last_name || addr.lastName}</span>
                              {(addr.is_default || addr.isDefault) && (
                                <span className="text-[10px] bg-amber-100 text-[#7d4b0e] font-semibold px-2 py-0.2 rounded-md">
                                  Default
                                </span>
                              )}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-[#7d4b0e] text-white flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <p className="text-stone-600 text-[11px] mt-1.5 leading-snug line-clamp-2">
                            {addr.address1 || addr.address_line1} {addr.address2 || addr.address_line2}
                          </p>
                          <p className="text-stone-600 text-[11px] uppercase font-medium mt-0.5">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-stone-500 text-[11px] mt-1 font-mono">{addr.phone}</p>
                        </div>
                      );
                    })}

                    {/* "+ Use New Address" card */}
                    <div
                      onClick={handleUseNewAddress}
                      className={`p-4 rounded-xl border border-dashed text-xs cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${addressMode === 'new'
                        ? 'border-[#7d4b0e] bg-amber-50/40 text-[#7d4b0e]'
                        : 'border-stone-300 hover:border-stone-400 text-stone-600 bg-white'
                        }`}
                    >
                      <Plus className="w-5 h-5 text-stone-400" />
                      <span className="font-bold text-xs">Use New Address</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivering To Preview Box */}
              {addressMode === 'saved' && shippingAddress.address1 && (
                <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-stone-200">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    DELIVERING TO
                  </span>
                  <p className="text-xs font-semibold text-stone-900 leading-snug">
                    {shippingAddress.address1} {shippingAddress.address2 ? `, ${shippingAddress.address2}` : ''}
                  </p>
                  <p className="text-xs text-stone-700 mt-0.5">
                    {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">{shippingAddress.country}</p>
                </div>
              )}

              {/* Manual New Address Inputs */}
              {(addressMode === 'new' || savedAddresses.length === 0) && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="House No, Building, Street, Area"
                      value={shippingAddress.address1}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address1: e.target.value })}
                      className="w-full bg-slate-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]/30 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        Pincode *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="6-digit pincode"
                          maxLength={6}
                          value={shippingAddress.pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          className="w-full bg-slate-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]/30 transition-all"
                        />
                        {pincodeLoading && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-400 absolute right-3 top-3" />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full bg-slate-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="w-full bg-slate-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]/30 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SELECT DELIVERY SPEED & METHOD */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
                  SELECT DELIVERY SPEED &amp; METHOD
                </label>

                {shippingLoading ? (
                  <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center gap-2 text-xs text-stone-500">
                    <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
                    <span>Calculating real-time courier shipping rates...</span>
                  </div>
                ) : shippingRates.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/70 text-center text-xs text-stone-500">
                    {shippingAddress.pincode && shippingAddress.pincode.length === 6 ? (
                      <p>No delivery methods available from API for pincode {shippingAddress.pincode}.</p>
                    ) : (
                      <p>Enter your 6-digit Pincode above to load delivery methods.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shippingRates.map((method, idx) => {
                      const isSelected = selectedShippingRate
                        ? (selectedShippingRate.method_id === method.method_id && Number(selectedShippingRate.cost) === Number(method.cost))
                        : idx === 0;
                      const costNum = Number(method.cost ?? 0);
                      return (
                        <div
                          key={method.method_id || idx}
                          onClick={() => setSelectedShippingRate(method)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSelected
                            ? 'border-[#7d4b0e] bg-amber-50/40 ring-1 ring-[#7d4b0e]'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-stone-100/80 text-stone-700 shrink-0">
                              <Truck className="w-4 h-4 text-stone-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-900 leading-tight">
                                {method.name || 'Shipping Method'}
                              </p>
                              {method.transit_time && (
                                <p className="text-[11px] text-stone-500 mt-0.5">
                                  Estimated delivery: {method.transit_time}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-stone-900">
                            {costNum === 0 ? 'FREE' : `₹${costNum.toFixed(2)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: PAYMENT METHOD & CONFIRMATION */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-[#7d4b0e] border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                    3
                  </div>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-tight">
                      Payment Method &amp; Confirmation
                    </h2>
                    <p className="text-[11px] sm:text-xs text-stone-500 font-sans mt-0.5">
                      Choose your preferred payment method from the store.
                    </p>
                  </div>
                </div>
              </div>

              {/* 🔹 SELECT PAYMENT OPTION (Full Payment First & Default) */}
              <div className="mb-6 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  SELECT PAYMENT OPTION
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Card 1: Full Payment (FIRST OPTION & DEFAULT) */}
                  <div
                    onClick={() => setPaymentPlan('full')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${!isPartialPayment
                        ? 'border-[#7d4b0e] bg-white ring-1 ring-[#7d4b0e]'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full">
                        100% PREPAID
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!isPartialPayment ? 'border-[#7d4b0e]' : 'border-stone-300'
                          }`}
                      >
                        {!isPartialPayment && <div className="w-2.5 h-2.5 rounded-full bg-[#7d4b0e]" />}
                      </div>
                    </div>

                    <h3 className="font-bold text-stone-900 text-xs sm:text-sm">
                      Full Payment (100% Prepaid)
                    </h3>
                    <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                      Pay the complete order value of <strong className="text-stone-900">₹{grandTotal.toFixed(2)}</strong> now. Fastest priority dispatch &amp; contact-free delivery.
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">Total to Pay Now:</span>
                      <span className="font-extrabold text-stone-900">₹{grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-teal-700 font-semibold mt-0.5">
                      <span>Balance at Delivery:</span>
                      <span>₹0.00 (PAID)</span>
                    </div>
                  </div>

                  {/* Card 2: Partial Payment (SECOND OPTION) */}
                  <div
                    onClick={() => {
                      setPaymentPlan('partial');
                      // If current selected provider was COD, auto switch to first available online gateway
                      if (String(selectedProvider).toLowerCase().includes('cod')) {
                        const firstOnline = gateways.find((g) => !String(g.provider || g.name || g.id).toLowerCase().includes('cod'));
                        if (firstOnline) {
                          setSelectedProvider(firstOnline.provider || firstOnline.name || firstOnline.id);
                        }
                      }
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${isPartialPayment
                        ? 'border-[#7d4b0e] bg-white ring-1 ring-[#7d4b0e]'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-[#7d4b0e] text-white px-2.5 py-0.5 rounded-full">
                        <Zap className="w-3 h-3 text-amber-300 fill-amber-300" /> MOST POPULAR
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isPartialPayment ? 'border-[#7d4b0e]' : 'border-stone-300'
                          }`}
                      >
                        {isPartialPayment && <div className="w-2.5 h-2.5 rounded-full bg-[#7d4b0e]" />}
                      </div>
                    </div>

                    <h3 className="font-bold text-stone-900 text-xs sm:text-sm">
                      Partial Payment (Advance + COD)
                    </h3>
                    <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                      Pay <strong className="text-[#7d4b0e]">₹{advanceAmount.toFixed(2)}</strong> online now to confirm order. Pay remaining <strong className="text-stone-900">₹{balanceDue.toFixed(2)}</strong> at delivery.
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">Advance Online:</span>
                      <span className="font-extrabold text-stone-900">₹{advanceAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-700 font-medium mt-0.5">
                      <span className="text-stone-500">Balance on COD:</span>
                      <span className="font-bold text-stone-900">₹{balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gateway Options Title */}
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                {isPartialPayment
                  ? `Choose Online Gateway to Pay ₹${advanceAmount.toFixed(2)} Advance`
                  : 'Choose Payment Method'}
              </div>

              {/* Gateway Options */}
              <div className="space-y-3 mb-6">
                {gatewaysLoading ? (
                  <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center gap-2 text-xs text-stone-500">
                    <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
                    <span>Loading available payment methods from store...</span>
                  </div>
                ) : availableGateways.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/70 text-center text-xs text-stone-500">
                    <p>No payment methods available from API.</p>
                  </div>
                ) : (
                  availableGateways.map((gw, idx) => {
                    const providerKey = gw.provider || gw.name || gw.id || `gw-${idx}`;
                    const isSelected = selectedProvider === providerKey;
                    const title = gw.display_title || gw.title || gw.name || gw.provider || 'Payment Method';
                    const description = gw.metadata?.description || gw.description || 'Secure payment gateway';
                    const isCod = String(providerKey).toLowerCase().includes('cod');

                    return (
                      <div
                        key={providerKey}
                        onClick={() => setSelectedProvider(providerKey)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                          ? 'border-[#7d4b0e] bg-amber-50/40 ring-1 ring-[#7d4b0e]'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isCod
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                              : 'bg-blue-50 border border-blue-100 text-blue-700'
                              }`}>
                              {isCod ? (
                                <Banknote className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Zap className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-stone-900">{title}</span>
                              </div>
                              <p className="text-stone-500 text-xs mt-1 leading-snug">
                                {description}
                              </p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 shrink-0 ${isSelected ? 'border-[#7d4b0e] bg-[#7d4b0e]' : 'border-stone-300'
                            }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Trust & Safety Protocol Box */}
              <div className="mb-6 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    Annapurna Store Trust &amp; Safety Protocol
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    By clicking Complete Payment, your transaction is processed under RBI-compliant gateway standards. Order tracking and receipt will be dispatched via WhatsApp &amp; Email immediately.
                  </p>
                </div>
              </div>

              {/* PAY CTA Button */}
              <button
                type="button"
                disabled={isPlacingOrder || (gateways.length === 0 && !gatewaysLoading)}
                onClick={handlePlaceOrder}
                className="w-full bg-[#4a1c24] hover:bg-[#38141b] text-white font-extrabold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 text-sm sm:text-base uppercase tracking-wider transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isPlacingOrder ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : isPartialPayment ? (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>PAY ADVANCE ₹{advanceAmount.toFixed(2)} &amp; PLACE ORDER</span>
                  </>
                ) : String(selectedProvider).toLowerCase().includes('cod') ? (
                  <>
                    <Banknote className="w-4 h-4 text-emerald-300" />
                    <span>PLACE COD ORDER (₹{grandTotal.toFixed(2)})</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>PAY ₹{grandTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28 self-start">
            <div className="bg-[#fcfaf7] border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 max-h-[calc(100vh-8.5rem)] overflow-y-auto">

              <h3 className="font-serif text-lg font-bold text-stone-900 tracking-tight">
                Order Summary ({cart.length})
              </h3>

              {/* Items List */}
              <div className="max-h-80 overflow-y-auto pr-1 space-y-3 divide-y divide-stone-100 scrollbar-thin">
                {cart.map((item) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-start gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-14 h-14 object-cover rounded-xl bg-orange-50 border border-stone-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                            {item.title}
                          </h4>
                          <span className="text-xs font-bold text-stone-900 shrink-0">
                            Rs.{lineTotal.toFixed(2)}
                          </span>
                        </div>
                        {item.variantTitle && (
                          <span className="inline-block text-[10px] font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-100 mt-0.5">
                            {item.variantTitle}
                          </span>
                        )}

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-stone-100 text-stone-600 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-stone-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:bg-stone-100 text-stone-600 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount Code Form */}
              <div className="pt-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{appliedCoupon.code} (-₹{appliedCoupon.amount.toFixed(2)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-emerald-700 hover:text-emerald-900 underline text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Discount code (e.g. SAVE20)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]/30 uppercase"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponInput.trim()}
                      className="bg-stone-700 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponMsg && (
                  <p className={`text-[11px] mt-1.5 font-medium ${couponMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-stone-200 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">Rs.{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span>- Rs.{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span className="font-semibold text-stone-900">
                    {selectedShippingRate ? (
                      shippingCost === 0 ? 'FREE' : `Rs.${shippingCost.toFixed(2)}`
                    ) : (
                      <span className="text-stone-400 font-normal">
                        {shippingRates.length === 0 ? 'Not calculated' : 'Select a method'}
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-stone-500">
                  <span>Estimated GST (Included) <span className="text-[10px] text-stone-400">(details)</span></span>
                  <span>Incl. Rs.{gstAmount.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-extrabold text-stone-900">Total</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Including all applicable taxes</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-[#7d4b0e]">
                    <span className="text-xs text-stone-500 font-medium mr-1">INR</span>
                    Rs.{grandTotal.toFixed(2)}
                  </span>
                </div>

                {/* Partial Payment Summary Breakdown */}
                {isPartialPayment && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600 font-medium">Advance Online (Now):</span>
                      <span className="font-extrabold text-[#7d4b0e]">Rs.{advanceAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600 font-medium">Balance at Delivery (COD):</span>
                      <span className="font-bold text-stone-900">Rs.{balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Authentic Guarantee Card */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#7d4b0e] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    100% Authentic &amp; Fresh Guarantee
                  </h4>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Authentic handcrafted traditional Gujarati snacks packed with utmost care and fresh quality.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
