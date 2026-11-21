import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import TopOfferBar from "./TopOfferBar";
import { Search, ShoppingCart, Heart, Menu, X } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export const Header: React.FC = () => {
  const { wishlist } = useWishlist();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const leftNavLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/shopbycollection", label: "Collection" },
    { href: "/shopbycollection/todays-offer", label: "Today's Offer" },
  ];

  const rightNavLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-transparent sticky top-0 z-50">
      <div className="pb-3 sm:pb-4">
        {/* Top Announcement Bar */}
        <TopOfferBar />

        {/* Main Floating Rounded Header */}
        <header className="max-w-[1400px] mx-auto md:px-2 px-1 relative mt-2">
          <div className="relative bg-amber-50/90 backdrop-blur-md rounded-full shadow-xl border border-amber-200">
            
            {/* Desktop Layout */}
            <div className="hidden lg:block">
              <div className="px-3 py-3 xl:px-5 xl:py-4">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 xl:gap-6">

                  {/* LEFT NAV LINKS */}
                  <nav className="flex justify-start items-center space-x-1 xl:space-x-2">
                    {leftNavLinks.map((link) => (
                      <Link
                        key={link.label}
                        to={link.href}
                        className={`px-4 xl:px-5 py-2 xl:py-2.5 rounded-full text-xs xl:text-sm font-semibold transition-all whitespace-nowrap ${
                          isActive(link.href)
                            ? "bg-white text-[#7d4b0e] shadow-md font-bold"
                            : "text-gray-700 hover:text-[#7d4b0e] hover:bg-white/50"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {/* CENTER GAP FOR OVERLAPPING LOGO */}
                  <div className="w-48 xl:w-64"></div>

                  {/* RIGHT NAV LINKS & ICONS */}
                  <div className="flex justify-end items-center space-x-2 xl:space-x-3">
                    {!isSearchOpen && rightNavLinks.map((link) => (
                      <Link
                        key={link.label}
                        to={link.href}
                        className={`px-4 xl:px-5 py-2 xl:py-2.5 rounded-full text-xs xl:text-sm font-semibold transition-all whitespace-nowrap ${
                          isActive(link.href)
                            ? "bg-white text-[#7d4b0e] shadow-md font-bold"
                            : "text-gray-700 hover:text-[#7d4b0e] hover:bg-white/50"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}

                    {/* Search Input Toggle */}
                    {isSearchOpen ? (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-48 xl:w-60 bg-white border border-amber-300 rounded-full py-2 pl-4 pr-8 text-base md:text-xs text-[#7d4b0e] focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]"
                          autoFocus
                        />
                        <button
                          onClick={() => setIsSearchOpen(false)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-[#7d4b0e]"
                        aria-label="Search"
                      >
                        <Search size={18} />
                      </button>
                    )}

                    {/* Cart Icon */}
                    <button
                      onClick={() => setIsCartOpen(true)}
                      className="relative p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-[#7d4b0e]"
                      aria-label="Open Cart"
                    >
                      <ShoppingCart size={18} />
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </button>

                    {/* Wishlist Heart Icon */}
                    {/* Wishlist Heart Icon */}
                    <Link
                      to="/wishlist"
                      className="relative p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-[#7d4b0e]"
                      aria-label="Wishlist"
                    >
                      <Heart size={18} />
                      {wishlist.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {wishlist.length}
                        </span>
                      )}
                    </Link>

                    {/* Brown Login or Profile Button */}
                    {isAuthenticated ? (
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-[#7d4b0e] text-white rounded-full font-bold text-xs xl:text-sm hover:bg-[#6b400c] shadow-md transition-all active:scale-95"
                      >
                        <div className="w-6 h-6 rounded-full bg-amber-200 text-[#7d4b0e] flex items-center justify-center text-xs font-black">
                          {((user as any)?.data?.first_name?.[0] || user?.first_name?.[0] || user?.firstName?.[0] || 'U').toUpperCase()}
                        </div>
                        <span className="max-w-[85px] truncate">
                          {(user as any)?.data?.first_name || user?.first_name || user?.firstName || 'Profile'}
                        </span>
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        className="px-5 py-2.5 bg-[#7d4b0e] text-white rounded-full font-bold text-xs xl:text-sm hover:bg-[#6b400c] shadow-md transition-all active:scale-95 inline-block"
                      >
                        Login
                      </Link>
                    )}
                  </div>

                </div>
              </div>

              {/* CENTER LOGO INSIDE NAVBAR CAPSULE */}
              <Link
                to="/"
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 hover:scale-105 transition-transform"
              >
                <img
                  src="https://cdn.shopify.com/s/files/1/0953/6284/2993/files/Megascale_Logo.png?v=1770090966"
                  alt="Annapurna Khakhra Logo"
                  className="h-12 sm:h-14 lg:h-16 xl:h-18 w-auto object-contain drop-shadow-md"
                />
              </Link>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-[#7d4b0e]"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <Link to="/">
                <img
                  src="https://cdn.shopify.com/s/files/1/0953/6284/2993/files/Megascale_Logo.png?v=1770090966"
                  alt="Annapurna Logo"
                  className="h-14 w-auto object-contain"
                />
              </Link>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 bg-white rounded-full shadow-md text-[#7d4b0e]"
                >
                  <ShoppingCart size={18} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Mobile Drawer */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-2 bg-amber-50/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-amber-200 space-y-2">
              {[...leftNavLinks, ...rightNavLinks].map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive(link.href)
                      ? "bg-[#7d4b0e] text-white"
                      : "text-slate-800 hover:bg-amber-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 border-t border-amber-200/60 flex flex-col gap-2">
                <Link
                  to="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-amber-100"
                >
                  <span>Wishlist</span>
                  {wishlist.length > 0 && (
                    <span className="bg-amber-200 text-[#7d4b0e] text-xs font-bold px-2 py-0.5 rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                {isAuthenticated ? (
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#7d4b0e] text-white rounded-xl text-sm font-bold shadow-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-200 text-[#7d4b0e] flex items-center justify-center text-xs font-black">
                      {((user as any)?.data?.first_name?.[0] || user?.first_name?.[0] || user?.firstName?.[0] || 'U').toUpperCase()}
                    </div>
                    <span>My Profile ({(user as any)?.data?.first_name || user?.first_name || user?.firstName || 'Account'})</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center px-4 py-2.5 bg-[#7d4b0e] text-white rounded-xl text-sm font-bold shadow-xs"
                  >
                    Login / Sign In
                  </Link>
                )}
              </div>
            </div>
          )}
        </header>
      </div>
    </div>
  );
};

export default Header;
