import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, Search, Heart, User, X, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isHome = location.pathname === '/';
  const isWishlist = location.pathname.startsWith('/wishlist');
  const isProfile =
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/account');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleQuickTagClick = (tag: string) => {
    setIsSearchOpen(false);
    navigate(`/shop?search=${encodeURIComponent(tag)}`);
  };

  // Hide on checkout or order-success page
  const isCheckout = location.pathname.startsWith('/checkout') || location.pathname.startsWith('/order-success');
  if (isCheckout) return null;

  return (
    <>
      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:hidden">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#7d4b0e] font-serif font-bold text-base">
                <Search className="w-4 h-4 text-orange-600" />
                <span>Search Products</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Khakhra, sweets, snacks..."
                className="w-full bg-amber-50/60 border border-amber-300 rounded-2xl py-3 pl-4 pr-12 text-base md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7d4b0e] focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-2 rounded-xl bg-[#7d4b0e] text-white hover:bg-[#6b400c] transition-colors cursor-pointer"
                aria-label="Submit search"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick search tags */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Popular Searches</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Pure Ghee', 'Methi', 'Jeera', 'Sugar Free', 'Lasan', 'Oil Khakhra'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-[#7d4b0e] rounded-full font-medium transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (Mobile Only) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200/70 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {/* 1. Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isHome ? 'text-[#7d4b0e]' : 'text-slate-500 hover:text-[#7d4b0e]'
            }`}
          >
            <div className={`p-1 rounded-full ${isHome ? 'bg-amber-100/70' : ''}`}>
              <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${isHome ? 'font-bold text-[#7d4b0e]' : 'font-medium'}`}>
              Home
            </span>
          </Link>

          {/* 2. Cart */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-[#7d4b0e] transition-colors relative cursor-pointer"
          >
            <div className="p-1 rounded-full relative">
              <ShoppingCart className="w-5 h-5 stroke-2" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              Cart
            </span>
          </button>

          {/* 3. Search */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-[#7d4b0e] transition-colors cursor-pointer"
          >
            <div className="p-1 rounded-full">
              <Search className="w-5 h-5 stroke-2" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              Search
            </span>
          </button>

          {/* 4. Wishlist */}
          <Link
            to="/wishlist"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isWishlist ? 'text-[#7d4b0e]' : 'text-slate-500 hover:text-[#7d4b0e]'
            }`}
          >
            <div className={`p-1 rounded-full relative ${isWishlist ? 'bg-amber-100/70' : ''}`}>
              <Heart className={`w-5 h-5 ${isWishlist ? 'fill-red-500 text-red-500 stroke-[2.5]' : 'stroke-2'}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length > 99 ? '99+' : wishlist.length}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${isWishlist ? 'font-bold text-[#7d4b0e]' : 'font-medium'}`}>
              Wishlist
            </span>
          </Link>

          {/* 5. Profile */}
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isProfile ? 'text-[#7d4b0e]' : 'text-slate-500 hover:text-[#7d4b0e]'
            }`}
          >
            <div className={`p-1 rounded-full ${isProfile ? 'bg-amber-100/70' : ''}`}>
              <User className={`w-5 h-5 ${isProfile ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${isProfile ? 'font-bold text-[#7d4b0e]' : 'font-medium'}`}>
              Profile
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
