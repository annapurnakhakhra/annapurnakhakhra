/**
 * Helper to dynamically load external gateway scripts and submit gateway forms
 */

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout.js');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const loadEasebuzzScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).EasebuzzCheckout) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/easebuzz-checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Easebuzz checkout SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export interface IciciFormPayload {
  service_url: string;
  form_payload: Record<string, any>;
}

/**
 * Creates and submits a hidden HTML POST form for ICICI Eazypay PG
 */
export const submitIciciForm = (serviceUrl: string, formPayload: Record<string, any>): void => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = serviceUrl;
  form.style.display = 'none';

  Object.entries(formPayload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = typeof value === 'object' ? JSON.stringify(value) : String(value);
      form.appendChild(input);
    }
  });

  document.body.appendChild(form);
  form.submit();
};

