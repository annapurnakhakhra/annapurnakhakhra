import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Heart,
  ShoppingBag,
  Truck,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Authentic WhatsApp Vector Icon
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893 0-3.177-1.237-6.164-3.488-8.414z" />
  </svg>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/profile';

  const { isAuthenticated, sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first OTP box when entering step 2
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Format clean 10 digits
  const getCleanPhone = () => {
    const digits = mobileNumber.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(digitsOnly);
    if (errorMsg) setErrorMsg('');
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = getCleanPhone();

    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      phoneInputRef.current?.focus();
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.');
      phoneInputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      await sendOtp({ phone: cleanPhone, channel: 'whatsapp' });
      setStep('otp');
      setCooldown(60);
      setSuccessMsg(`We've sent a 6-digit verification code to your WhatsApp at +91 ${cleanPhone}`);
    } catch (err: any) {
      console.error('Send WhatsApp OTP error:', err);
      const serverError = err.message || err.error || '';
      if (serverError.includes('131009')) {
        setErrorMsg('WhatsApp delivery failed. Please check your mobile number and try again.');
      } else {
        setErrorMsg(serverError || 'Failed to send WhatsApp OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Handle pasting 6 digits into any box
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (pastedDigits.length > 0) {
        const newOtp = [...otpValues];
        pastedDigits.forEach((digit, i) => {
          if (index + i < 6) {
            newOtp[index + i] = digit;
          }
        });
        setOtpValues(newOtp);
        const nextFocus = Math.min(5, index + pastedDigits.length);
        otpInputsRef.current[nextFocus]?.focus();
        return;
      }
    }

    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    // Auto-advance focus
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpValues.join('');

    if (otpCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const cleanPhone = getCleanPhone();
      await verifyOtp({ phone: cleanPhone }, otpCode);

      setSuccessMsg('WhatsApp verification successful! Logging you in...');
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 700);
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setErrorMsg(err.message || err.error || 'Invalid or expired OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const cleanPhone = getCleanPhone();
      await sendOtp({ phone: cleanPhone, channel: 'whatsapp' });
      setCooldown(60);
      setSuccessMsg(`A new OTP has been sent to your WhatsApp at +91 ${cleanPhone}`);
    } catch (err: any) {
      setErrorMsg(err.message || err.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = getCleanPhone();

  return (
    <div className="min-h-[84vh] flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 bg-gradient-to-b from-[#fdfbf7] via-[#fff8f0] to-[#fdfbf7]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group mb-3">
            <span className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-[#7d4b0e] group-hover:text-[#6b400c] transition-colors">
              Annapurna<span className="text-amber-600">.</span>
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {step === 'input' ? 'Login with WhatsApp' : 'Verify WhatsApp OTP'}
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            {step === 'input' ? (
              'Enter your 10-digit mobile number to receive an instant verification code on WhatsApp.'
            ) : (
              <span>
                Enter the 6-digit OTP code sent to your WhatsApp at{' '}
                <strong className="text-slate-900">+91 {cleanPhone}</strong>
              </span>
            )}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200/80 transition-all">
          {/* Alerts */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* STEP 1: MOBILE NUMBER INPUT */}
          {step === 'input' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label
                  htmlFor="mobile-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  WhatsApp Mobile Number
                </label>

                <div className="relative flex items-center">
                  {/* Country Code Badge */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 pr-2.5 flex items-center pointer-events-none text-slate-600 font-bold text-xs sm:text-sm border-r border-slate-200 my-2">
                    <span className="mr-1.5 text-base">🇮🇳</span>
                    <span>+91</span>
                  </div>

                  <input
                    ref={phoneInputRef}
                    id="mobile-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required
                    autoFocus
                    placeholder="98765 43210"
                    value={mobileNumber}
                    onChange={handleMobileInputChange}
                    className="w-full pl-22 pr-10 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold tracking-wider text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />

                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                  </div>
                </div>

                <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  We will send your one-time verification code directly to WhatsApp.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || mobileNumber.length !== 10}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa51] text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending WhatsApp OTP...</span>
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Send OTP on WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Enter 6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setErrorMsg('');
                      setSuccessMsg('');
                      setOtpValues(['', '', '', '', '', '']);
                    }}
                    className="text-xs font-semibold text-[#7d4b0e] hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Change mobile number
                  </button>
                </div>

                {/* WhatsApp Notification Banner */}
                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                    <span>Check your WhatsApp messages for the code</span>
                  </div>
                  <a
                    href="https://web.whatsapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline shrink-0"
                  >
                    <span>Open WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="grid grid-cols-6 gap-2 sm:gap-2.5 my-3">
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-full h-12 sm:h-14 text-center font-bold text-lg sm:text-xl text-slate-800 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpValues.join('').length !== 6}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa51] text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              {/* Resend Link & Timer */}
              <div className="text-center pt-1 border-t border-slate-100">
                {cooldown > 0 ? (
                  <p className="text-xs text-slate-500">
                    Resend OTP on WhatsApp in{' '}
                    <span className="font-bold text-emerald-700">{cooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors inline-flex items-center gap-1"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>Didn't receive the code? Resend OTP via WhatsApp</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Security Banner */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-end encrypted 100% password-free login</span>
          </div>
        </div>

        {/* Benefits Cards below */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/60 backdrop-blur-xs border border-amber-100 rounded-2xl p-3 shadow-2xs">
            <ShoppingBag className="w-5 h-5 mx-auto text-[#7d4b0e] mb-1" />
            <h4 className="text-[11px] font-bold text-slate-800">Fast Orders</h4>
            <p className="text-[10px] text-slate-500 leading-tight">Instant address recall</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xs border border-amber-100 rounded-2xl p-3 shadow-2xs">
            <Truck className="w-5 h-5 mx-auto text-[#7d4b0e] mb-1" />
            <h4 className="text-[11px] font-bold text-slate-800">Track Orders</h4>
            <p className="text-[10px] text-slate-500 leading-tight">Live dispatch info</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xs border border-amber-100 rounded-2xl p-3 shadow-2xs">
            <Heart className="w-5 h-5 mx-auto text-[#7d4b0e] mb-1" />
            <h4 className="text-[11px] font-bold text-slate-800">Saved Wishlist</h4>
            <p className="text-[10px] text-slate-500 leading-tight">Sync across devices</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
