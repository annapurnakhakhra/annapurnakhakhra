import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeroSection } from "../components/Herosection";
import { FestiveNoticeBanner } from "../components/FestiveNoticeBanner";
import { CategoriesSlider } from "../components/CategoriesSlider";
import { OurPromiseSection } from "../components/OurPromiseSection";
import { ProductCard } from "../components/ProductCard";
import { KhakhraMakingProcess } from "../components/KhakhraMakingProcess";
import { CraftsmanshipHeritageSection } from "../components/CraftsmanshipHeritageSection";
import { ShopByOilPreferenceSection } from "../components/ShopByOilPreferenceSection";
import { FlourOptionsSection } from "../components/FlourOptionsSection";
import { TestimonialsCarousel } from "../components/TestimonialsCarousel";
import { CallToActionSection } from "../components/CallToActionSection";
import { FAQSection } from "../components/FAQSection";
import { productService } from "../services/products";
import type { Product } from "../types";

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getAllProducts(12).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-[#fdfbf7]">

      {/* 1. Hero Banner Slider Section */}
      <HeroSection />

      {/* 2. Static Festive & Courier Notice Banner (Placed after banner slider, above Our Collection) */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <FestiveNoticeBanner className="rounded-2xl md:rounded-3xl shadow-sm" />
      </div>

      {/* 3. Category Grid / Our Collection */}
      <CategoriesSlider />

      {/* 3. Our Promise Section */}
      <OurPromiseSection />

      {/* 4. Our Top Selling Khakhra (Loaded dynamically via API) */}
      <div className="max-w-7xl mx-auto py-6 md:py-12 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#7C4A0E] text-center font-serif mb-2">
          Our Top Selling Khakhra
        </h2>
        <p className="text-[#cc760e] text-sm sm:text-base md:text-lg leading-relaxed text-center mb-10">
          Freshly crafted, lovingly made. Explore our bestsellers.
        </p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-amber-100/50 h-80 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-8 md:mt-12">
          <Link
            to="/shop"
            className="group flex items-center gap-2 bg-[#7d4b0e] text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-sm md:text-base font-bold tracking-wide shadow-md hover:bg-[#6b400c] transition-all duration-300"
          >
            <span>View All</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>

      {/* 5. Khakhra Making Process */}
      <KhakhraMakingProcess />

      {/* 6. Craftsmanship & Heritage */}
      <CraftsmanshipHeritageSection />

      {/* 7. Shop by Oil Preference */}
      <ShopByOilPreferenceSection />

      {/* 8. Flour Options */}
      <FlourOptionsSection />

      {/* 9. Testimonials */}
      <TestimonialsCarousel />

      {/* 10. Call to Action */}
      <CallToActionSection />

      {/* 11. FAQ Section */}
      <FAQSection />

    </div>
  );
};

export default Home;
