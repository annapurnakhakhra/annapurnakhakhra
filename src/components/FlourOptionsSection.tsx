import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const FlourOptionsSection: React.FC = () => {
  const flourOptions = [
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/2.jpg?v=1782792840",
      title: "Wheat Khakhra / Wheat Biscuit Bhakhri",
      keyword: "Wheat",
      desc: "Soft & daily staple flour",
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/9_1.jpg?v=1782792510",
      title: "Ragi Khakhra",
      keyword: "Ragi",
      desc: "Rich in calcium & fiber",
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/3_1.jpg?v=1782792657",
      title: "Bajri Khakhra / Bajra Biscuit Bhakhri",
      keyword: "Bajri",
      desc: "Warm & winter special",
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/4_1.jpg?v=1782792904",
      title: "Juvar Khakhra",
      keyword: "Juvar",
      desc: "Gluten-free energy grain",
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/5_1.jpg?v=1782792567",
      title: "Jav(barley) Khakhra",
      keyword: "Jav",
      desc: "High fiber healthy grain",
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/6.jpg?v=1782793053",
      title: "Mag Khakhra",
      keyword: "Mag",
      desc: "Light, easy to digest",
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/7_1.jpg?v=1782793105",
      title: "Chana Khakhra",
      keyword: "Chana",
      desc: "Protein rich gram flour",
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/8.jpg?v=1782793104",
      title: "Makai Khakhra",
      keyword: "Makai",
      desc: "Naturally sweet corn flour",
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/1_1.jpg?v=1782793104",
      title: "Farali Khakhra / Farali Biscuit Bhakhri",
      keyword: "Farali",
      desc: "Perfect for fasting meals",
    },
  ];

  return (
    <section className="py-12 md:py-24 bg-[#fff7e5] relative overflow-hidden border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 text-center">

        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 text-[#7C4A0E] font-serif"
        >
          Explore By Grain & Flour Type
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl mx-auto text-[#cc760e] mb-12 text-sm md:text-base leading-relaxed"
        >
          From classic whole wheat to nutrient-dense Ragi, Bajra, Jowar & Farali options.
        </motion.p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
          {flourOptions.map((flour, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Link
                to={`/shop?search=${flour.keyword}`}
                className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-200 flex flex-col items-center text-center h-full"
              >
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-amber-50 mb-3">
                  <img
                    src={flour.image}
                    alt={flour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-sm text-[#7C4A0E] group-hover:text-amber-600 transition-colors line-clamp-1">
                  {flour.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{flour.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FlourOptionsSection;
