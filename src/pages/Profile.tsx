import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User,
  MapPin,
  Plus,
  Edit2,
  LogOut,
  Trash2,
  CheckCircle2,
  ShoppingBag,
  Mail,
  Phone,
  X,
  RefreshCw,
  ArrowRight,
  Package,
  Truck,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { customerService, type CustomerAddress, type CustomerProfilePayload } from '../services/customer';
import { orderService } from '../services/orders';

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

const formatPrice = (amount?: number | string) => {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return Number.isInteger(num) ? `₹${num}` : `₹${num.toFixed(2)}`;
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'orders' ? 'activity' : 'profile';

  const { user, isAuthenticated, isLoading: authLoading, logout, refreshProfile } = useAuth();
  const { wishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'activity'>(initialTab);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Orders State & Pagination
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage, setOrdersPerPage] = useState<number>(5);
  const orderHistoryRef = useRef<HTMLDivElement | null>(null);

  // Orders Pagination Calculations
  const totalOrders = orders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const paginatedOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    orderHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileForm, setProfileForm] = useState<CustomerProfilePayload>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  // Address Modal & Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | string | null>(null);
  const [pincodeLookingUp, setPincodeLookingUp] = useState(false);
  const [addressForm, setAddressForm] = useState<CustomerAddress>({
    first_name: '',
    last_name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    is_default: false,
  });

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/profile', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      const u: any = (user as any)?.data || user;
      setProfileForm({
        first_name: u.first_name || u.firstName || '',
        last_name: u.last_name || u.lastName || '',
        email: u.email || '',
        phone: u.phone || '',
      });
    }
  }, [user]);

  // Fetch customer addresses
  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const data = await customerService.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load customer addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  // Fetch customer orders (order list from /api/shop/customer/me)
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const profile = await customerService.getProfile();
      const rawOrders = profile?.orders || profile?.data?.orders || [];
      setOrders(Array.isArray(rawOrders) ? rawOrders : []);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
      loadOrders();
    }
  }, [isAuthenticated, loadAddresses, loadOrders]);

  // Open & Fetch complete order details by ID
  const handleOpenOrderDetail = async (orderId: string | number) => {
    setLoadingOrderDetail(true);
    setOrderDetailError(null);
    setSelectedOrder({ id: orderId, loading: true });
    try {
      const detail = await orderService.getOrderById(orderId);
      const orderData = detail?.data || detail?.order || detail;
      setSelectedOrder(orderData);
    } catch (err: any) {
      console.error(`Failed to fetch order details [${orderId}]:`, err);
      setOrderDetailError(err.message || err.error || 'Failed to load order details.');
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);

    try {
      const payload: CustomerProfilePayload = {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        phone: currentUser.phone || profileForm.phone,
      };
      await customerService.updateProfile(payload);
      await refreshProfile();
      setProfileMsg({ type: 'success', text: 'Profile details updated successfully!' });
      setEditingProfile(false);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Pincode auto-lookup
  const handlePincodeChange = async (pin: string) => {
    const cleaned = pin.replace(/\D/g, '').slice(0, 6);
    setAddressForm((prev) => ({ ...prev, pincode: cleaned }));

    if (cleaned.length === 6) {
      setPincodeLookingUp(true);
      try {
        const info = await customerService.lookupPincode(cleaned);
        if (info && (info.city || info.state)) {
          setAddressForm((prev) => ({
            ...prev,
            city: info.city || prev.city,
            state: info.state || prev.state,
          }));
        }
      } catch (err) {
        console.warn('Pincode auto-fill failed:', err);
      } finally {
        setPincodeLookingUp(false);
      }
    }
  };

  // Save (Add or Update) Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);

    const payload: CustomerAddress = {
      ...addressForm,
      address_line1: addressForm.address1 || addressForm.address_line1,
      address_line2: addressForm.address2 || addressForm.address_line2,
    };

    try {
      if (editingAddressId) {
        await customerService.updateAddress(editingAddressId, payload);
      } else {
        await customerService.addAddress(payload);
      }
      setShowAddressModal(false);
      setEditingAddressId(null);
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to save address.');
    } finally {
      setAddressSaving(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await customerService.deleteAddress(id);
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete address.');
    }
  };

  // Set Default Address
  const handleSetDefault = async (id: number | string) => {
    try {
      await customerService.setDefaultAddress(id);
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to set default address.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/');
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#7d4b0e] animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  const currentUser: any = (user as any)?.data || user || {};
  const currentFirstName = profileForm.first_name || currentUser.first_name || currentUser.firstName || '';
  const currentLastName = profileForm.last_name || currentUser.last_name || currentUser.lastName || '';
  const currentEmail = profileForm.email || currentUser.email || '';
  const currentPhone = profileForm.phone || currentUser.phone || '';

  const displayName =
    (currentFirstName || currentLastName)
      ? `${currentFirstName} ${currentLastName}`.trim()
      : 'Valued Customer';

  const avatarInitial = (currentFirstName?.[0] || displayName[0] || 'U').toUpperCase();

  return (
    <div className="min-h-[85vh] bg-[#fdfbf7] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Top Profile Hero Card */}
        <div className="bg-gradient-to-r from-amber-900 via-[#7d4b0e] to-amber-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100 text-[#7d4b0e] flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-lg ring-4 ring-white/20 shrink-0">
                {avatarInitial}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight">
                    {displayName}
                  </h1>
                  <span className="bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Member
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-amber-100/90 font-medium">
                  {currentEmail && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 opacity-80" />
                      {currentEmail}
                    </span>
                  )}
                  {currentPhone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 opacity-80" />
                      {currentPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-2xl transition-all backdrop-blur-xs active:scale-95"
              >
                <LogOut className="w-4 h-4 text-rose-300" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-3 border border-white/5 text-center cursor-pointer"
            >
              <span className="text-lg sm:text-xl font-black text-amber-200">{orders.length}</span>
              <p className="text-[11px] text-amber-100/80 font-medium">Orders Placed</p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-3 border border-white/5 text-center cursor-pointer"
            >
              <span className="text-lg sm:text-xl font-black text-amber-200">{addresses.length}</span>
              <p className="text-[11px] text-amber-100/80 font-medium">Saved Addresses</p>
            </button>
            <Link to="/wishlist" className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-3 border border-white/5">
              <span className="text-lg sm:text-xl font-black text-amber-200">{wishlist.length}</span>
              <p className="text-[11px] text-amber-100/80 font-medium">Wishlist Items</p>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-amber-200/80 gap-3 sm:gap-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'profile'
              ? 'border-[#7d4b0e] text-[#7d4b0e]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Information</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'addresses'
              ? 'border-[#7d4b0e] text-[#7d4b0e]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'activity'
              ? 'border-[#7d4b0e] text-[#7d4b0e]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders & Shortcuts</span>
            {orders.length > 0 && (
              <span className="bg-amber-100 text-[#7d4b0e] text-[10px] font-black px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: Profile Information */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-amber-100 rounded-3xl p-6 sm:p-8 shadow-sm max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-serif">Personal Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage your personal information and contact settings</p>
              </div>

              {!editingProfile && (
                <button
                  onClick={() => {
                    setProfileForm({
                      first_name: currentFirstName,
                      last_name: currentLastName,
                      email: currentEmail,
                      phone: currentPhone,
                    });
                    setEditingProfile(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7d4b0e] hover:text-[#6b400c] bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {profileMsg && (
              <div
                className={`mb-6 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-medium ${profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <X className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {editingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Phone Number
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        Verified (Cannot change)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        disabled
                        readOnly
                        value={profileForm.phone || currentPhone || ''}
                        className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed select-none focus:outline-none"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Mobile number is verified with WhatsApp OTP and cannot be modified.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-[#7d4b0e] hover:bg-[#6b400c] rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {profileSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
                  <p className="font-bold text-slate-800 text-sm mt-1">{displayName}</p>
                </div>

                <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <p className="font-bold text-slate-800 text-sm mt-1">{currentEmail || 'Not specified'}</p>
                </div>

                <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5 text-amber-700" />
                      Verified
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm mt-1">{currentPhone || 'Not added'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-serif">Delivery Addresses</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage and organize your preferred shipping destinations</p>
              </div>

              <button
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressForm({
                    first_name: currentFirstName,
                    last_name: currentLastName,
                    phone: currentPhone,
                    address1: '',
                    address2: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India',
                    is_default: addresses.length === 0,
                  });
                  setShowAddressModal(true);
                }}
                className="inline-flex items-center gap-2 bg-[#7d4b0e] hover:bg-[#6b400c] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Address</span>
              </button>
            </div>

            {loadingAddresses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-40 bg-amber-50/40 rounded-3xl animate-pulse" />
                <div className="h-40 bg-amber-50/40 rounded-3xl animate-pulse" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white border border-amber-200/80 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 mx-auto">
                  <MapPin className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Saved Addresses</h3>
                <p className="text-xs text-slate-500">
                  Save your home or work address for fast 1-click checkout on your next Khakhra order.
                </p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-5 py-2.5 bg-[#7d4b0e] text-white rounded-xl text-xs font-bold hover:bg-[#6b400c]"
                >
                  Add Address Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const isDefault = addr.is_default || addr.isDefault;
                  return (
                    <div
                      key={addr.id}
                      className={`bg-white border rounded-3xl p-6 shadow-xs relative space-y-3 transition-all ${isDefault
                        ? 'border-amber-500 ring-2 ring-amber-200/60 shadow-md'
                        : 'border-orange-100 hover:border-amber-200'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {addr.first_name || addr.firstName} {addr.last_name || addr.lastName}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            📞 {addr.phone || 'No phone'}
                          </p>
                        </div>

                        {isDefault && (
                          <span className="bg-amber-100 text-[#7d4b0e] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                            Default Address
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                        <p>{addr.address1 || addr.address_line1}</p>
                        {(addr.address2 || addr.address_line2) && (
                          <p>{addr.address2 || addr.address_line2}</p>
                        )}
                        <p className="font-semibold text-slate-700">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-slate-400">{addr.country || 'India'}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        {!isDefault ? (
                          <button
                            onClick={() => handleSetDefault(addr.id!)}
                            className="text-[#7d4b0e] font-bold hover:underline text-xs"
                          >
                            Set as Default
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-3 ml-auto">
                          <button
                            onClick={() => {
                              setEditingAddressId(addr.id!);
                              setAddressForm({
                                first_name: addr.first_name || addr.firstName || '',
                                last_name: addr.last_name || addr.lastName || '',
                                phone: addr.phone || '',
                                address1: addr.address1 || addr.address_line1 || '',
                                address2: addr.address2 || addr.address_line2 || '',
                                city: addr.city || '',
                                state: addr.state || '',
                                pincode: addr.pincode || '',
                                country: addr.country || 'India',
                                is_default: !!isDefault,
                              });
                              setShowAddressModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-800 transition-colors"
                            title="Edit Address"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteAddress(addr.id!)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Orders & Shortcuts */}
        {activeTab === 'activity' && (
          <div className="space-y-8">
            {/* Order History Card (matching Image 2) */}
            <div ref={orderHistoryRef} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-serif text-[#6b2828] tracking-tight">
                    Order History
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Review all your past pooja samagri and sacred orders
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadOrders}
                  disabled={loadingOrders}
                  className="text-xs font-semibold text-slate-500 hover:text-amber-900 transition-colors flex items-center gap-1.5 pt-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Orders List */}
              {loadingOrders && orders.length === 0 ? (
                <div className="space-y-4">
                  <div className="h-44 bg-slate-50 border border-slate-200/60 rounded-2xl animate-pulse" />
                  <div className="h-44 bg-slate-50 border border-slate-200/60 rounded-2xl animate-pulse" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-amber-200 rounded-2xl bg-amber-50/20">
                  <ShoppingBag className="w-10 h-10 text-amber-700/60 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">No Orders Placed Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    When you place an order, its real-time shipping updates and items will appear right here.
                  </p>
                  <Link
                    to="/shop"
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#7d4b0e] hover:bg-[#6b400c] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>Start Shopping</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedOrders.map((order) => {
                    const items = order.items || [];
                    const itemCount = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || items.length || 1;
                    const isPaid = (order.financial_status || '').toLowerCase() === 'paid';
                    const displayPrice = order.total_amount ? formatPrice(order.total_amount) : '₹0';
                    const orderDate = formatDate(order.created_at || order.order_date);

                    return (
                      <div
                        key={order.id}
                        className="border border-slate-200/90 rounded-2xl p-5 sm:p-6 bg-white hover:border-amber-300 transition-all shadow-2xs"
                      >
                        {/* Top Line: #10065 • 14 Aug 2026   PAID  ₹1 */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
                            <span>{order.order_number || `#${order.id}`}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs sm:text-sm font-normal text-slate-500">{orderDate}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {isPaid ? (
                              <span className="bg-emerald-100 text-emerald-800 font-black text-[11px] px-2.5 py-0.5 rounded-full tracking-wide">
                                PAID
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 font-black text-[11px] px-2.5 py-0.5 rounded-full tracking-wide uppercase">
                                {order.financial_status || 'PENDING'}
                              </span>
                            )}
                            <span className="font-bold text-slate-900 text-base sm:text-lg">
                              {displayPrice}
                            </span>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="py-4 space-y-3">
                          {items.map((it: any, idx: number) => {
                            const itemImg = it.product_image || it.image_url || it.image;
                            return (
                              <div key={it.id || idx} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  {itemImg ? (
                                    <img
                                      src={itemImg}
                                      alt={it.title}
                                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-slate-100 bg-amber-50 shrink-0"
                                      onError={(e: any) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                                      <Package className="w-5 h-5 opacity-60" />
                                    </div>
                                  )}

                                  <div>
                                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1">
                                      {it.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Qty: {it.quantity || 1}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-xs sm:text-sm font-semibold text-slate-800 shrink-0">
                                  {formatPrice(it.price || it.total_amount)}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom Line: 1 item   View Order Details > */}
                        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                          <span className="text-xs text-slate-500 font-medium">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenOrderDetail(order.id)}
                            className="text-xs sm:text-sm font-bold text-[#7d4b0e] hover:text-[#6b400c] flex items-center gap-1 transition-colors group cursor-pointer"
                          >
                            <span>View Order Details</span>
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Controls */}
                  {totalOrders > 0 && (
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Showing Counts */}
                      <div className="text-xs text-slate-500 font-medium">
                        Showing <span className="font-bold text-slate-800">{Math.min(indexOfFirstOrder + 1, totalOrders)}</span> to{' '}
                        <span className="font-bold text-slate-800">{Math.min(indexOfLastOrder, totalOrders)}</span> of{' '}
                        <span className="font-bold text-slate-800">{totalOrders}</span> orders
                      </div>

                      {/* Page Buttons */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                          {/* Previous Button */}
                          <button
                            type="button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Prev</span>
                          </button>

                          {/* Numeric Buttons */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                              if (
                                totalPages > 7 &&
                                pageNum !== 1 &&
                                pageNum !== totalPages &&
                                Math.abs(pageNum - currentPage) > 1
                              ) {
                                if (pageNum === 2 || pageNum === totalPages - 1) {
                                  return (
                                    <span key={pageNum} className="px-1 text-xs text-slate-400">
                                      …
                                    </span>
                                  );
                                }
                                return null;
                              }

                              const isActive = pageNum === currentPage;
                              return (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${isActive
                                    ? 'bg-[#7d4b0e] text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50'
                                    }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>

                          {/* Next Button */}
                          <button
                            type="button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Orders per page dropdown */}
                      {totalOrders > 3 && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span>Show:</span>
                          <select
                            value={ordersPerPage}
                            onChange={(e) => {
                              setOrdersPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#7d4b0e] cursor-pointer"
                          >
                            <option value={3}>3 / page</option>
                            <option value={5}>5 / page</option>
                            <option value={10}>10 / page</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Address Form Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 font-serif mb-1">
              {editingAddressId ? 'Update Address' : 'Add New Address'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">Enter your complete address for accurate delivery.</p>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.first_name}
                    onChange={(e) => setAddressForm({ ...addressForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={addressForm.last_name}
                    onChange={(e) => setAddressForm({ ...addressForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Address Line 1 (Flat/House/Building) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Sunshine Heights"
                  value={addressForm.address1}
                  onChange={(e) => setAddressForm({ ...addressForm, address1: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Address Line 2 (Street/Area)</label>
                <input
                  type="text"
                  placeholder="e.g. Linking Road, Bandra West"
                  value={addressForm.address2}
                  onChange={(e) => setAddressForm({ ...addressForm, address2: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pincode *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="380001"
                      value={addressForm.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                    />
                    {pincodeLookingUp && (
                      <RefreshCw className="w-3 h-3 text-amber-600 animate-spin absolute right-2 top-2.5" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultAddressCheckbox"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="w-4 h-4 text-[#7d4b0e] border-slate-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="defaultAddressCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Make this my default shipping address
                </label>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#7d4b0e] hover:bg-[#6b400c] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addressSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingAddressId ? 'Update' : 'Save'} Address</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-amber-200 relative my-8 overflow-hidden max-h-[92vh] flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-amber-50/60 to-orange-50/40">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Order Details
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                  {selectedOrder.order_number || `#${selectedOrder.id}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {formatDateTime(selectedOrder.order_date || selectedOrder.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {loadingOrderDetail && !selectedOrder.products && !selectedOrder.items ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#7d4b0e] animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">Loading complete order details...</p>
                </div>
              ) : orderDetailError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Error loading order details</span>
                  </div>
                  <p>{orderDetailError}</p>
                  <button
                    type="button"
                    onClick={() => handleOpenOrderDetail(selectedOrder.id)}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {/* Status Badges Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Payment
                      </span>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                        {selectedOrder.financial_status || selectedOrder.payment_details?.status || 'PAID'}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Fulfillment
                      </span>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 uppercase tracking-wide">
                        {selectedOrder.fulfillment_status || 'FULFILLED'}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Shipment
                      </span>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 uppercase tracking-wide">
                        {selectedOrder.status || 'SHIPPED'}
                      </span>
                    </div>
                  </div>

                  {/* Tracking / Shipment Card (if latest_shipment exists) */}
                  {selectedOrder.latest_shipment && (
                    <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                              Shipment #{selectedOrder.latest_shipment.shipment_number || 'Tracking Info'}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Carrier: {selectedOrder.latest_shipment.carrier || 'Express Courier'}
                            </p>
                          </div>
                        </div>

                        {selectedOrder.latest_shipment.tracking_url && (
                          <a
                            href={selectedOrder.latest_shipment.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                          >
                            <span>Track Package</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 grid grid-cols-2 gap-2 pt-2 border-t border-blue-100">
                        {selectedOrder.latest_shipment.tracking_number && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tracking Number</span>
                            <span className="font-mono font-bold text-slate-800">{selectedOrder.latest_shipment.tracking_number}</span>
                          </div>
                        )}
                        {selectedOrder.latest_shipment.shipped_at && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shipped Date</span>
                            <span className="font-medium text-slate-800">{formatDate(selectedOrder.latest_shipment.shipped_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ordered Products Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Ordered Products ({(selectedOrder.products || selectedOrder.items || []).length})
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                      {(selectedOrder.products || selectedOrder.items || []).map((prod: any, idx: number) => {
                        const img = prod.image || prod.product_image || prod.image_url;
                        return (
                          <div key={idx} className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {img ? (
                                <img
                                  src={img}
                                  alt={prod.title}
                                  className="w-14 h-14 object-cover rounded-xl border border-slate-200/80 bg-white shrink-0"
                                  onError={(e: any) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-14 h-14 bg-amber-100/60 rounded-xl flex items-center justify-center text-amber-800 shrink-0">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                                  {prod.title}
                                </h5>
                                {prod.variant?.title && (
                                  <span className="inline-block mt-0.5 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                    Variant: {prod.variant.title}
                                  </span>
                                )}
                                <p className="text-[11px] text-slate-500 mt-1">
                                  Qty: {prod.quantity} × {formatPrice(prod.price)}
                                </p>
                              </div>
                            </div>

                            <div className="font-bold text-xs sm:text-sm text-slate-900 shrink-0">
                              {formatPrice(prod.total_amount || (parseFloat(prod.price || '0') * (prod.quantity || 1)))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Address & Payment Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Delivery Address */}
                    {selectedOrder.address && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-[#7d4b0e]" />
                          <span>Delivery Address</span>
                        </div>
                        <p className="font-bold text-slate-900">
                          {selectedOrder.address.first_name} {selectedOrder.address.last_name}
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          {selectedOrder.address.address_line1}
                          {selectedOrder.address.address_line2 ? `, ${selectedOrder.address.address_line2}` : ''}
                        </p>
                        <p className="text-slate-600 font-semibold">
                          {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                        </p>
                        <p className="text-slate-500">
                          📞 {selectedOrder.address.phone}
                        </p>
                      </div>
                    )}

                    {/* Payment Info */}
                    {selectedOrder.payment_details && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                          <CreditCard className="w-3.5 h-3.5 text-[#7d4b0e]" />
                          <span>Payment Information</span>
                        </div>
                        <p className="text-slate-600">
                          Method: <strong className="text-slate-900 uppercase">{selectedOrder.payment_details.payment_method || selectedOrder.payment_details.provider}</strong>
                        </p>
                        {selectedOrder.payment_details.transaction_reference && (
                          <p className="text-slate-600 font-mono text-[11px]">
                            Ref: <span className="font-bold text-slate-800">{selectedOrder.payment_details.transaction_reference}</span>
                          </p>
                        )}
                        <p className="text-slate-600">
                          Status: <span className="font-bold text-emerald-700 uppercase">{selectedOrder.payment_details.status}</span>
                        </p>
                        {selectedOrder.payment_details.paid_at && (
                          <p className="text-slate-400 text-[11px]">
                            Paid: {formatDateTime(selectedOrder.payment_details.paid_at)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Amounts & Price Breakdown */}
                  {selectedOrder.amounts && (
                    <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4 sm:p-5 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Items Subtotal</span>
                        <span>{formatPrice(selectedOrder.amounts.subtotal_amount)}</span>
                      </div>
                      {parseFloat(selectedOrder.amounts.discount_amount || '0') > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Discount Applied</span>
                          <span>-{formatPrice(selectedOrder.amounts.discount_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery / Shipping</span>
                        <span>{parseFloat(selectedOrder.amounts.shipping_amount || '0') === 0 ? 'FREE' : formatPrice(selectedOrder.amounts.shipping_amount)}</span>
                      </div>
                      {parseFloat(selectedOrder.amounts.tax_amount || '0') > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Taxes</span>
                          <span>{formatPrice(selectedOrder.amounts.tax_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-amber-200/80">
                        <span>Total Paid</span>
                        <span className="text-base text-[#7d4b0e]">
                          {formatPrice(selectedOrder.amounts.total_amount || selectedOrder.total_amount)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Annapurna Khakhra Orders
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 text-xs font-bold bg-[#7d4b0e] hover:bg-[#6b400c] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
