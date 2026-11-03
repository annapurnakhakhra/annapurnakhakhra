import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface CraftsmanshipProps {
  title?: string;
  text?: string;
  image?: string;
  ctaText?: string;
  ctaHref?: string;
}

export const CraftsmanshipHeritageSection: React.FC<CraftsmanshipProps> = ({
  title = "Handcrafted with Heart, Rooted in Tradition.",
  text = "Every khakhra at Annapurna is prepared by skilled women artisans trained in the art of slow-roasting.\n Nothing factory-made. Nothing mass-produced. Only original, authentic, handcrafted crunch.",
  image = "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/14_26792e80-ffa3-4562-93f1-a95a0bfe5f0e.png?v=1770090983",
  ctaText = "Our Story",
  ctaHref = "/about",
}) => {
  return (
    <section className="relative w-full bg-gradient-to-br from-amber-50 via-white to-slate-50 py-12 md:py-24 overflow-hidden border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
        
        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-6 order-2 md:order-1"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#7C4A0E] font-serif leading-snug">
            {title}
          </h2>

          <p className="text-[#cc760e] text-base sm:text-lg max-w-xl leading-relaxed whitespace-pre-line">
            {text}
          </p>

          <div>
            <Link
              to={ctaHref}
              className="inline-block bg-gradient-to-r from-[#7C4A0E] to-[#aa7534] text-white font-semibold px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
            >
              {ctaText}
            </Link>
          </div>
        </motion.div>

        {/* RIGHT IMAGE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full h-[300px] sm:h-[380px] md:h-[440px] overflow-hidden rounded-3xl shadow-2xl group order-1 md:order-2 border-4 border-white"
        >
          <img
            src={image}
            alt="Artisans preparing Khakhra"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </motion.div>

      </div>
    </section>
  );
};

export default CraftsmanshipHeritageSection;
