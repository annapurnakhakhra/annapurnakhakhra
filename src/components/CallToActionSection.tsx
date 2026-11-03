import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export const CallToActionSection: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-[#7C4A0E] via-[#8d5410] to-[#aa7534] text-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-4 py-1.5 rounded-full text-xs font-bold text-amber-200 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Special Online Offer</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif leading-tight">
          Ready for a Healthy, Authentic Tea-Time Snack?
        </h2>

        <p className="text-amber-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Order your favorite Khakhra varieties today. Freshly vacuum packed & delivered straight from Gujarat to your doorstep!
        </p>

        <div className="pt-4 flex justify-center">
          <Link
            to="/shop"
            className="bg-white text-[#7C4A0E] font-bold text-base px-8 py-4 rounded-full hover:bg-amber-100 transition-all shadow-xl flex items-center gap-2 group active:scale-95"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
