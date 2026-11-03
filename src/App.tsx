import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { GoToTopButton } from './components/GoToTopButton';
import { ScrollToTop } from './components/ScrollToTop';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Wishlist } from './pages/Wishlist';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Checkout } from './pages/Checkout';
import { CheckoutCallback } from './pages/CheckoutCallback';
import { CheckoutFailure } from './pages/CheckoutFailure';
import { OrderSuccess } from './pages/OrderSuccess';
import { Blog } from './pages/Blog';
import { BlogPostDetail } from './pages/BlogPostDetail';
import { CollectionsIndex } from './pages/CollectionsIndex';
import { CollectionDetail } from './pages/CollectionDetail';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FAQPage } from './pages/FAQPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ReturnPolicy } from './pages/ReturnPolicy';
import { ShippingPolicy } from './pages/ShippingPolicy';
import { TermsAndConditions } from './pages/TermsAndConditions';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-[#fdfbf7]">
              <Header />
              <main className="flex-1 pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/collections" element={<CollectionsIndex />} />
                  <Route path="/shopbycollection" element={<CollectionsIndex />} />
                  <Route path="/collections/:handle" element={<CollectionDetail />} />
                  <Route path="/shopbycollection/:handle" element={<CollectionDetail />} />
                  <Route path="/product/:handle" element={<ProductDetail />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/account" element={<Profile />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/callback/:provider" element={<CheckoutCallback />} />
                  <Route path="/checkout/failure" element={<CheckoutFailure />} />
                  <Route path="/checkout/success" element={<OrderSuccess />} />
                  <Route path="/checkout/success/:id" element={<OrderSuccess />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/order-success/:id" element={<OrderSuccess />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:handle" element={<BlogPostDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/return-policy" element={<ReturnPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/terms-and-condition" element={<TermsAndConditions />} />
                </Routes>
              </main>
              <CartDrawer />
              <Footer />
              <WhatsAppFloatingButton />
              <GoToTopButton />
              <MobileBottomNav />
            </div>
          </Router>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
};

export default App;
