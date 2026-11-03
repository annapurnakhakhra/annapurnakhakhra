import React from 'react';

export const ShippingPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-[#7d4b0e] font-serif">Shipping & Delivery Policy</h1>
      <p className="text-xs text-slate-500">Last updated: October 2026</p>
      
      <div className="prose prose-amber text-slate-700 text-xs sm:text-sm leading-relaxed space-y-4">
        <p>
          We pack and ship all handmade khakhra varieties directly from our factory in Surat, Gujarat to ensure maximum freshness.
        </p>

        <h2 className="text-base font-bold text-[#7d4b0e]">1. Dispatch & Delivery Speeds</h2>
        <p>
          Orders are dispatched within 24 hours of placement. Standard delivery takes 2-4 business days for metro cities and 3-6 business days for rural locations across India.
        </p>

        <h2 className="text-base font-bold text-[#7d4b0e]">2. Free Shipping Eligibility</h2>
        <p>
          Orders totaling ₹599 or more automatically receive FREE SHIPPING. For orders under ₹599, a flat shipping fee of ₹49 applies.
        </p>
      </div>
    </div>
  );
};

export default ShippingPolicy;
