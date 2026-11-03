import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Clock, Heart } from 'lucide-react';
import { productService, DEFAULT_COLLECTIONS } from '../services/products';

export const CollectionsIndex: React.FC = () => {
  const [collections, setCollections] = useState<any[]>(DEFAULT_COLLECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getCollections().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setCollections(data);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Hero Section */}
      <div className="relative pt-10 pb-6 overflow-hidden text-center space-y-3">
        <span className="bg-amber-100 text-[#7d4b0e] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full inline-block">
          Handcrafted Varieties
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#7d4b0e] font-serif">
          Our Gourmet Collections
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto px-4">
          Explore our wide range of authentic handmade Gujarati Khakhra, Pure Ghee Bhakhri, Farali upwas snacks, and sweets.
        </p>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-80 bg-amber-50/50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
            {collections.map((col, index) => {
              const handle = col.handle || 'pure-ghee';
              const imgUrl = col.image?.url || col.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80';
              const title = col.title || 'Special Khakhra Collection';

              return (
                <Link
                  key={col.id || handle || index}
                  to={`/shopbycollection/${handle}`}
                  className="group relative flex flex-col rounded-3xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border border-orange-100"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
                    <img
                      src={imgUrl}
                      alt={title}
                      className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Hover Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg text-[#7d4b0e]">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 bg-white space-y-2">
                    <h3 className="text-xl font-bold text-[#7d4b0e] group-hover:text-amber-600 transition-colors">
                      {title}
                    </h3>

                    <div className="flex items-center gap-2 text-[#7d4b0e] font-semibold text-xs pt-1">
                      <span>Explore Collection</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>

                  {/* Accent Line */}
                  <div className="h-1.5 bg-gradient-to-r from-[#7d4b0e] via-amber-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 py-16 mt-12 border-t border-amber-200/60">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm space-y-3">
              <Award className="w-10 h-10 text-[#7d4b0e]" />
              <h3 className="text-base font-bold text-[#7d4b0e]">Premium Quality</h3>
              <p className="text-xs text-slate-600">Hand-selected whole wheat & 100% Pure Desi Ghee ingredients.</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm space-y-3">
              <Clock className="w-10 h-10 text-[#7d4b0e]" />
              <h3 className="text-base font-bold text-[#7d4b0e]">Traditional Crafting</h3>
              <p className="text-xs text-slate-600">Slow roasted on hot tavas by master women artisans of Gujarat.</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm space-y-3">
              <Heart className="w-10 h-10 text-[#7d4b0e]" />
              <h3 className="text-base font-bold text-[#7d4b0e]">Made with Love</h3>
              <p className="text-xs text-slate-600">Every pack delivers authentic home-cooked flavor & crispness.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionsIndex;
