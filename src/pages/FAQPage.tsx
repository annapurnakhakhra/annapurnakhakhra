import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What makes Annapurna Khakhra different from factory-made khakhra?",
      answer: "Annapurna Khakhra is 100% hand-rolled and slow-roasted on traditional iron tawas by women artisans. Factory khakhra is machine-extruded and fried, whereas ours is roasted with 0% oil or pure desi ghee for genuine crispness."
    },
    {
      question: "What is the shelf life of Annapurna Khakhra packs?",
      answer: "Our khakhra packs have a natural shelf life of 6 months from the date of manufacturing, thanks to our airtight foil packaging. No chemical preservatives are added."
    },
    {
      question: "Do you offer Farali / Upwas khakhra options for fasting?",
      answer: "Yes! We have a dedicated Farali range prepared with Rajgira (Amaranth), Kuttu (Buckwheat), Sabudana, and Sendha Namak (Rock Salt) specifically for fasting days."
    },
    {
      question: "How long does shipping take across India?",
      answer: "Orders are processed and dispatched within 24 hours. Delivery takes 2-4 business days for major metro cities and 3-6 days for rest of India."
    },
    {
      question: "What is the minimum order for Free Shipping?",
      answer: "All orders above ₹599 qualify for automatic FREE SHIPPING across India!"
    },
    {
      question: "How does the MegaEcom OTP checkout process work?",
      answer: "When you checkout, we send a quick 6-digit OTP code to your email address. Once verified, your order details and shipping address sync directly with our order fulfillment engine."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <span className="bg-amber-100 text-[#7d4b0e] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full inline-block">
            Frequently Asked Questions
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#7d4b0e] font-serif">
            Help & Knowledge Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Find answers to common questions about ingredients, roasting methods, shipping speeds, and bulk orders.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-orange-100 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-slate-800 text-sm hover:text-[#7d4b0e] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-orange-600' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
