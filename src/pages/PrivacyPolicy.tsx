import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-[#7d4b0e] font-serif">Privacy Policy</h1>
      <p className="text-xs text-slate-500">Last updated: October 2026</p>
      
      <div className="prose prose-amber text-slate-700 text-xs sm:text-sm leading-relaxed space-y-4">
        <p>
          At Annapurna Khakhra (operated by Annapurna Gruh Udhyog), we prioritize the privacy and security of our customers' personal data. This Privacy Policy outlines how we collect, use, and protect your information when visiting our web store or completing orders via our MegaEcom verification engine.
        </p>
        
        <h2 className="text-base font-bold text-[#7d4b0e]">1. Information We Collect</h2>
        <p>
          We collect your name, email address, shipping address, and phone number when you place an order or verify your identity via email OTP. We do not store sensitive credit card or net banking credentials; all payment transactions are handled securely by PCI-DSS compliant payment gateways (such as Razorpay).
        </p>

        <h2 className="text-base font-bold text-[#7d4b0e]">2. Use of Information</h2>
        <p>
          Your information is used strictly to fulfill orders, process shipments, send order tracking updates, and improve customer service.
        </p>

        <h2 className="text-base font-bold text-[#7d4b0e]">3. Data Security</h2>
        <p>
          We implement SSL encryption across all store pages and API endpoints to ensure your data remains protected against unauthorized access.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
