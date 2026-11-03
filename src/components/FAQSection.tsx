import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export const FAQSection: React.FC = () => {
  const faqs = [
    {
      q: "What is the shelf life of Annapurna Khakhra?",
      a: "Our Khakhra products are vacuum sealed and have a shelf life of up to 6 months from the date of manufacturing.",
    },
    {
      q: "Are the Khakhra snacks fried or roasted?",
      a: "All our Khakhra products are 100% slow-roasted on traditional tavas with zero deep frying or palm oil.",
    },
    {
      q: "How does MegaEcom OTP Verification work?",
      a: "During checkout, simply enter your email address. You will receive a 6-digit OTP code to complete your order without needing a password!",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept Cash on Delivery (COD) as well as online payments via Razorpay (UPI, Credit/Debit Cards, NetBanking).",
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24 bg-[#fff7e5] border-b border-amber-100">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-[#7C4A0E] font-serif mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-sm text-[#cc760e] mb-10">
          Everything you need to know about our products & ordering process.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm md:text-base text-[#7C4A0E] flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-amber-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
