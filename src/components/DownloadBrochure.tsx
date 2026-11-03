import React, { useState } from 'react';
import { Download } from 'lucide-react';

export const DownloadBrochure: React.FC<{ buttonText?: string; className?: string }> = ({
  buttonText = "Download Brochure",
  className = "text-[#7d4b0e] hover:text-amber-800 text-xs sm:text-sm font-semibold hover:underline"
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = "Full name is required (min 2 characters)";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address";
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = "Please enter a valid 10-digit phone number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("https://adminrocket.megascale.co.in/api/brochure-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          store: "hit-megascale.myshopify.com",
        }),
      });
      await res.json();

      // Trigger download
      const link = document.createElement("a");
      link.href = "https://cdn.shopify.com/s/files/1/0953/6284/2993/files/_Khakhra_Catalog.pdf?v=1770090988";
      link.target = "_blank";
      link.download = "Annapurna_Khakhra_Brochure.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setOpen(false);
      setFormData({ name: '', email: '', phone: '' });
      setErrors({});
    } catch (err) {
      alert("Downloading brochure catalog...");
      window.open("https://cdn.shopify.com/s/files/1/0953/6284/2993/files/_Khakhra_Catalog.pdf?v=1770090988", "_blank");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {buttonText}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl space-y-4">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 text-lg font-bold"
            >
              ✕
            </button>

            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#7d4b0e] font-serif">
              <Download className="w-5 h-5 text-orange-600" />
              <span>Download Product Catalog</span>
            </h2>
            <p className="text-xs text-slate-500">
              Enter your contact details to download our complete product catalog and wholesale price list.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
              <div>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 p-3 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.name && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.name}</p>}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-200 p-3 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.email && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.email}</p>}
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="10-digit Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-slate-200 p-3 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.phone && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.phone}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7d4b0e] text-white py-3.5 rounded-xl text-xs font-bold hover:bg-[#6b400c] transition-colors disabled:opacity-60 shadow-md"
              >
                {loading ? "Downloading Catalog..." : "Get PDF Brochure Now"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DownloadBrochure;
