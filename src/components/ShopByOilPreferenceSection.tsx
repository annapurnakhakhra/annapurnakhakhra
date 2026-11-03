import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface OilOption {
  name: string;
  desc: string;
  image: string;
  cta: string;
  link: string;
}

interface ShopByOilProps {
  title?: string;
  oils?: OilOption[];
}

export const ShopByOilPreferenceSection: React.FC<ShopByOilProps> = ({
  title = "Choose Your Oil. Choose Your Lifestyle.",
  oils = [
    {
      name: "Oil Khakhra",
      desc: "Light, crisp, and perfect for daily snacking.",
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/7_d43757f8-76c6-4254-8edb-931c88d194ae.png?v=1770090982",
      cta: "Shop Now",
      link: "/shop?category=Oil",
    },
    {
      name: "Pure Ghee Khakhra",
      desc: "Luxurious, aromatic, and truly divine.",
      image: "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/9_9d267641-0b3a-4283-bf31-719c12be27fa.png?v=1770090969",
      cta: "Shop Now",
      link: "/shop?category=Pure+Ghee",
    },
  ],
}) => {
  return (
    <section className="relative bg-[#fdfbf7] py-6 md:py-10 border-b border-amber-100">
      <div className="max-w-6xl mx-auto px-4">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#7C4A0E] font-serif">
            {title}
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {oils.map((oil, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-3xl border border-amber-200 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div className="bg-[#fff7ec] p-6 flex justify-center">
                <img
                  src={oil.image}
                  alt={oil.name}
                  className="h-48 object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-6 text-center space-y-2">
                <h3 className="text-xl font-bold text-[#7C4A0E] font-serif">{oil.name}</h3>
                <p className="text-sm text-[#9c6b2f]">{oil.desc}</p>
                <div className="pt-2">
                  <Link
                    to={oil.link}
                    className="inline-block bg-[#7d4b0e] text-white font-bold text-xs px-6 py-2.5 rounded-full hover:bg-[#6b400c] transition-colors"
                  >
                    {oil.cta}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ShopByOilPreferenceSection;
