import React from 'react';

export const TermsAndConditions: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-[#7d4b0e] font-serif">Terms & Conditions</h1>
      <p className="text-xs text-slate-500">Last updated: October 2026</p>
      
      <div className="prose prose-amber text-slate-700 text-xs sm:text-sm leading-relaxed space-y-4">
        <p>
          Welcome to Annapurna Khakhra! By accessing our website or placing an order, you agree to comply with and be bound by the following terms and conditions.
        </p>

        <h2 className="text-base font-bold text-[#7d4b0e]">1. Product Description & Pricing</h2>
        <p>
          We strive to present product descriptions, weight, and pricing accurately. Prices are subject to change without prior notice, but price changes will not affect orders already confirmed.
        </p>

        <h2 className="text-base font-bold text-[#7d4b0e]">2. Intellectual Property</h2>
        <p>
          All trademarks, logos, photographs, and brand assets on this web application belong exclusively to Annapurna Gruh Udhyog.
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditions;
