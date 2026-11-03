import React from "react";
import { motion } from "framer-motion";

interface Step {
  image: string;
  title: string;
  desc: string;
}

export const KhakhraMakingProcess: React.FC = () => {
  const steps: Step[] = [
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/k5.png?v=1770090973",
      title: "Premium Ingredients",
      desc: "Finest wheat, spices, and oils carefully selected for rich authentic taste."
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/k6.png?v=1770090971",
      title: "Perfect Dough",
      desc: "Soft, smooth dough kneaded with precision for ideal texture."
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/k7.png?v=1770090973",
      title: "Hand Rolling",
      desc: "Each khakhra is rolled evenly for thin, uniform crispness."
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/k8.png?v=1770090975",
      title: "Slow Roasting",
      desc: "Roasted on low flame to achieve a golden, crunchy perfection."
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/9_9d267641-0b3a-4283-bf31-719c12be27fa.png?v=1770090969",
      title: "Flavor Seasoning",
      desc: "Balanced seasoning added for consistent, delightful taste."
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/k10.png?v=1770090972",
      title: "Fresh Packing",
      desc: "Packed with hygiene and care so freshness stays locked in."
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-[#fff7e5] relative overflow-hidden border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 text-center">

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 text-[#7C4A0E] font-serif"
        >
          How Our Khakhra is Made
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl mx-auto text-[#cc760e] mb-10 text-sm md:text-base leading-relaxed"
        >
          Traditional techniques blended with modern hygiene. Each Khakhra is handmade with care, purity and love.
        </motion.p>

        {/* STEP CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-3xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-amber-200/60 flex flex-col items-center text-center group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-amber-50 mb-4">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="w-8 h-8 rounded-full bg-[#7C4A0E] text-white font-bold text-sm flex items-center justify-center mb-2 shadow-xs">
                {i + 1}
              </span>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{step.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-2">{step.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default KhakhraMakingProcess;
