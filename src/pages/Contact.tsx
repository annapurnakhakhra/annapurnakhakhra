import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { enquiryService, type CreateEnquiryPayload } from '../services/enquiry';

export const Contact: React.FC = () => {
  const { user } = useAuth();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    subject: 'Wholesale / Bulk Order',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; id?: string | number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation function for each field
  const validateField = (name: string, value: string): string => {
    const val = value || '';
    switch (name) {
      case 'first_name': {
        const trimmed = val.trim();
        if (!trimmed) return 'First name is required';
        if (trimmed.length < 2) return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return 'First name can only contain letters';
        return '';
      }
      case 'last_name': {
        const trimmed = val.trim();
        if (!trimmed) return 'Last name is required';
        if (trimmed.length < 2) return 'Last name must be at least 2 characters';
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return 'Last name can only contain letters';
        return '';
      }
      case 'email': {
        const trimmed = val.trim();
        if (!trimmed) return 'Email address is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) return 'Please enter a valid email address';
        return '';
      }
      case 'mobile': {
        const trimmed = val.trim();
        if (!trimmed) return 'Mobile number is required';
        const digits = trimmed.replace(/\D/g, '');

        if (trimmed.startsWith('+')) {
          if (trimmed.startsWith('+91')) {
            const local = digits.slice(2);
            if (local.length !== 10) return 'Please enter a valid 10-digit mobile number';
            if (!/^[6-9]/.test(local)) return 'Mobile number must start with 6, 7, 8, or 9';
            return '';
          }
          if (digits.length < 10 || digits.length > 15) {
            return 'Please enter a valid mobile number (10-15 digits)';
          }
          return '';
        }

        let local = digits;
        if (digits.length === 11 && digits.startsWith('0')) {
          local = digits.slice(1);
        } else if (digits.length === 12 && digits.startsWith('91')) {
          local = digits.slice(2);
        }

        if (local.length !== 10) {
          return 'Please enter a valid 10-digit mobile number';
        }
        if (!/^[6-9]/.test(local)) {
          return 'Mobile number must start with 6, 7, 8, or 9';
        }
        return '';
      }
      case 'message': {
        const trimmed = val.trim();
        if (!trimmed) return 'Message is required';
        if (trimmed.length < 10) return 'Message must be at least 10 characters';
        return '';
      }
      default:
        return '';
    }
  };

  const validateAll = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    (['first_name', 'last_name', 'email', 'mobile', 'message'] as const).forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) errs[field] = err;
    });
    setErrors(errs);
    return errs;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  // Pre-fill fields if customer is logged in
  useEffect(() => {
    if (user) {
      const u: any = (user as any)?.data || user;
      setForm((prev) => ({
        ...prev,
        first_name: prev.first_name || u.first_name || u.firstName || '',
        last_name: prev.last_name || u.last_name || u.lastName || '',
        email: prev.email || u.email || '',
        mobile: prev.mobile || u.phone || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Mark all required fields as touched
    setTouched({
      first_name: true,
      last_name: true,
      email: true,
      mobile: true,
      message: true,
    });

    // Run full validation
    const errs = validateAll();
    const errorKeys = Object.keys(errs);
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0];
      const el = document.querySelector(`[name="${firstField}"]`) as HTMLElement | null;
      if (el) el.focus();
      return;
    }

    setLoading(true);

    try {
      // Clean and normalize mobile number
      let cleanMobile = form.mobile.trim();
      const digitsOnly = cleanMobile.replace(/\D/g, '');
      if (!cleanMobile.startsWith('+') && digitsOnly.length === 10) {
        cleanMobile = `+91${digitsOnly}`;
      } else if (!cleanMobile.startsWith('+') && digitsOnly.length > 10) {
        cleanMobile = `+${digitsOnly}`;
      }

      // Prepend selected subject to message for clear context
      const fullMessage = form.subject
        ? `[Inquiry: ${form.subject}]\n${form.message.trim()}`
        : form.message.trim();

      const payload: CreateEnquiryPayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        mobile: cleanMobile,
        message: fullMessage,
      };

      const res = await enquiryService.submitEnquiry(payload);

      setSuccessInfo({
        message: res?.message || 'Your enquiry has been received successfully. We will get back to you shortly.',
        id: res?.data?.id,
      });
      setSubmitted(true);
      setErrors({});
      setTouched({});
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        subject: 'Wholesale / Bulk Order',
        message: '',
      });
    } catch (err: any) {
      console.error('Failed to submit enquiry:', err);
      const apiMessage = err?.message || err?.error || (typeof err === 'string' ? err : 'Failed to submit inquiry. Please try again.');
      setErrorMsg(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setSuccessInfo(null);
    setErrorMsg(null);
    setErrors({});
    setTouched({});
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="bg-amber-100 text-[#7d4b0e] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full inline-block">
            Get in Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#7d4b0e] font-serif">
            Contact & Bulk Order Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Have questions about our Khakhra varieties, shipping, or wholesale corporate gifting? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Contact Details Cards */}
          <div className="space-y-4">
            <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#7d4b0e] flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Support</h3>
                <p className="font-bold text-slate-800 text-sm mt-0.5">+91 98765 43210</p>
                <p className="text-[11px] text-slate-400">Mon-Sat 9:00 AM - 7:00 PM</p>
              </div>
            </div>

            <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#7d4b0e] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Inquiry</h3>
                <p className="font-bold text-slate-800 text-sm mt-0.5">support@annapurnakhakhra.com</p>
                <p className="text-[11px] text-slate-400">We reply within 24 hours</p>
              </div>
            </div>

            <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#7d4b0e] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Kitchen & Factory Address</h3>
                <p className="font-bold text-slate-800 text-xs mt-0.5 leading-relaxed">
                  Annapurna Gruh Udhyog, Plot 42, GIDC Industrial Estate, Surat, Gujarat - 395006
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-[#7d4b0e] font-bold text-lg font-serif">
              <MessageSquare className="w-5 h-5" />
              <h2>Send Us a Message</h2>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success State */}
            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-8 rounded-3xl text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-emerald-900">Enquiry Received!</h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                    {successInfo?.message || 'Thank you! Your message has been received. Our team will contact you shortly.'}
                  </p>
                  {successInfo?.id && (
                    <p className="text-[11px] font-semibold text-emerald-700 mt-2">
                      Reference ID: <span className="font-mono bg-emerald-100/80 px-2 py-0.5 rounded-md">#{successInfo.id}</span>
                    </p>
                  )}
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-2 bg-[#7d4b0e] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#6b400c] transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      placeholder="e.g. Shantanu"
                      value={form.first_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl transition-all ${
                        touched.first_name && errors.first_name
                          ? 'bg-rose-50/40 border border-rose-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]'
                      }`}
                    />
                    {touched.first_name && errors.first_name && (
                      <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      placeholder="e.g. Kolhatkar"
                      value={form.last_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl transition-all ${
                        touched.last_name && errors.last_name
                          ? 'bg-rose-50/40 border border-rose-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]'
                      }`}
                    />
                    {touched.last_name && errors.last_name && (
                      <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                {/* Email & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl transition-all ${
                        touched.email && errors.email
                          ? 'bg-rose-50/40 border border-rose-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]'
                      }`}
                    />
                    {touched.email && errors.email && (
                      <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="+91 98765 43210"
                      value={form.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl transition-all ${
                        touched.mobile && errors.mobile
                          ? 'bg-rose-50/40 border border-rose-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]'
                      }`}
                    />
                    {touched.mobile && errors.mobile && (
                      <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.mobile}</p>
                    )}
                  </div>
                </div>

                {/* Inquiry Type / Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Inquiry Type</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e] cursor-pointer"
                  >
                    <option value="Wholesale / Bulk Order">Wholesale / Bulk Order</option>
                    <option value="Order Tracking & Support">Order Tracking & Support</option>
                    <option value="Distributorship Inquiry">Distributorship Inquiry</option>
                    <option value="Product Feedback">Product Feedback</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Message *</label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Tell us how we can assist you with your inquiry or bulk requirement..."
                    value={form.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl resize-y transition-all ${
                      touched.message && errors.message
                        ? 'bg-rose-50/40 border border-rose-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d4b0e]'
                    }`}
                  />
                  {touched.message && errors.message && (
                    <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#7d4b0e] text-white py-3.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#6b400c] transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Enquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Enquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
