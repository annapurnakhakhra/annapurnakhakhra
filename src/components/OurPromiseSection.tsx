import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface OurPromiseSectionProps {
  image?: string;
  title?: string;
  introText?: string;
  promiseItems?: string[];
  ctaText?: string;
  ctaHref?: string;
}

export const OurPromiseSection: React.FC<OurPromiseSectionProps> = ({
  image = "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/12_f72fc31b-053b-454e-85b3-d480aa12c885.png?v=1770090988",
  title = "Our Promise: Purity in Every Bite.",
  introText = "At Annapurna Khakhra, we believe that real taste comes from real ingredients. Every khakhra is handmade in small batches, prepared with premium wheat, pure spices, and the warmth of traditional Gruh Udhyog values.",
  promiseItems = [
    "Clean, hygienic preparation",
    "Pure ingredients with no shortcuts",
    "Authentic slow-roasting technique",
    "Home-style recipe passed down through generations",
  ],
  ctaText = "Learn More",
  ctaHref = "/about",
}) => {
  return (
    <section className="relative w-full bg-[#fdfbf7] py-6 md:py-12 overflow-hidden border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* 3D IMAGE CONTAINER */}
        <motion.div
          className="relative w-full h-[320px] sm:h-[400px] lg:h-[460px]"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative w-full h-full overflow-hidden rounded-3xl shadow-2xl border-4 border-white group">
            <img
              src={image}
              alt="Fresh ingredients used to craft authentic khakhra"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
          </div>
        </motion.div>

        {/* TEXT & PROMISE LIST */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-[#7C4A0E] text-xs font-bold uppercase tracking-wider">
            Traditional Gruh Udhyog
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#7C4A0E] font-serif leading-tight">
            {title}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {introText}
          </p>

          {/* Promise Items List */}
          <div className="space-y-3 pt-2">
            {promiseItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-200/80 text-[#7C4A0E] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{item}</span>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Link
              to={ctaHref}
              className="inline-flex items-center gap-2 bg-[#7d4b0e] text-white px-7 py-3.5 rounded-full text-sm font-semibold shadow-md hover:bg-[#6b400c] transition-all duration-300 group"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default OurPromiseSection;
