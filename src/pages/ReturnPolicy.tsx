import React from 'react';

export const ReturnPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-[#7d4b0e] font-serif">Return & Refund Policy</h1>
      <p className="text-xs text-slate-500">Last updated: October 2026</p>
      
      <div className="prose prose-amber text-slate-700 text-xs sm:text-sm leading-relaxed space-y-4">
        <p>
          At Annapurna Khakhra, we strive for 100% customer satisfaction with every freshly roasted pack delivered. Because our products are perishable food items, specific return guidelines apply.
        </p>

        <h2 className="text-base font-bold text-[#7d4b0e]">1. Damaged or Defective Packages</h2>
        <p>
          If your package arrives damaged, unsealed, or compromised, please contact our support team at support@annapurnakhakhra.com within 48 hours of delivery with a photograph of the damaged box. We will immediately dispatch a free replacement or issue a full refund.
        </p>

        <h2 className="text-base font-bold text-[#7d4b0e]">2. Refunds Process</h2>
        <p>
          Approved refunds are processed back to your original payment method within 3-5 business days.
        </p>
      </div>
    </div>
  );
};

export default ReturnPolicy;
