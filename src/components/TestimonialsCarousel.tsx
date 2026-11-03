import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

export const TestimonialsCarousel: React.FC = () => {
  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Mumbai",
      comment: "The Methi and Masala Khakhra are so fresh and crispy! My kids love having them with morning tea. Authentic Gujarati taste.",
      rating: 5,
    },
    {
      name: "Rajesh Patel",
      location: "Ahmedabad",
      comment: "Ordered Pure Ghee Khakhra for the first time. The packaging is superb, zero breakage during delivery, and the flavor is top-notch!",
      rating: 5,
    },
    {
      name: "Neha Verma",
      location: "Bengaluru",
      comment: "Super fast delivery and OTP checkout was seamless! Loved the Bajra and Ragi options for my daily diet.",
      rating: 5,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#fdfbf7] relative overflow-hidden border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 text-center">
        
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#7C4A0E] font-serif mb-3"
        >
          Loved By Over 10,000+ Customers
        </motion.h2>

        <p className="text-sm md:text-base text-[#cc760e] mb-12 max-w-xl mx-auto">
          Here is what our happy snackers have to say about Annapurna Khakhra.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all border border-amber-200/80 flex flex-col justify-between text-left relative"
            >
              <Quote className="w-8 h-8 text-amber-300 absolute top-6 right-6 opacity-40" />

              <div className="space-y-4">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">"{t.comment}"</p>
              </div>

              <div className="pt-6 border-t border-amber-100 mt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#7C4A0E]">{t.name}</h4>
                  <span className="text-xs text-slate-400">{t.location}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                  Verified Buyer
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TestimonialsCarousel;
