# E-Commerce Checkout & Multi-Payment Gateway API Documentation

This document contains complete `cURL` requests for the full shopping and checkout lifecycle:
1. **Add to Cart & View Cart** (with Guest or Customer token)
2. **Shipping & Tax Calculation** (tax inclusive / exclusive based on destination)
3. **Fetch Active Payment Gateways** (Razorpay, ICICI Bank, Easebuzz, Cash on Delivery)
4. **Checkout Started (Sync Abandoned Checkout)**
5. **Initiate Payment** (Razorpay, ICICI, Easebuzz, COD)
6. **Payment Success Verification -> Creates & Settles Paid Order**
7. **Payment Failed / Cancelled -> Keeps as Abandoned Checkout (No paid order created)**
8. **Automated Gateway Webhooks** (Server-to-Server Payment Settlement)

---

## 🔑 Common Headers

| Header | Description | Required |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Yes |
| `X-Shopfront-Token` | Your Storefront Access Token | Yes |
| `Authorization` | `Bearer <customer_jwt_token>` (for logged-in customers) | Optional |
| `X-Cart-Token` | `cart_<random_uuid>` (for guest sessions) | Optional (Required if guest) |

---

## 1. Cart Management

### 1.1 Add Item to Cart
```bash
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/cart/add' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--header 'X-Cart-Token: cart_guest_session_12345' \
--data-raw '{
    "product_id": 12,
    "variant_id": 34,
    "quantity": 2
}'
```

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "id": 101,
    "product_id": 12,
    "variant_id": 34,
    "quantity": 2
  }
}
```

---

### 1.2 Get Cart Details
```bash
curl --location --request GET 'https://megaecomm.megascale.co.in/backend/api/shop/cart' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--header 'X-Cart-Token: cart_guest_session_12345'
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 101,
        "product_id": 12,
        "variant_id": 34,
        "product_title": "Premium Silk Scarf",
        "variant_title": "Midnight Blue / Standard",
        "price": "999.00",
        "quantity": 2,
        "line_total": 1998.00
      }
    ],
    "subtotal": 1998.00,
    "total_items": 2
  }
}
```

---

## 2. Get Available Payment Gateways (Storefront)

Fetches all payment gateways currently **Active (Enabled)** by the store owner (Razorpay, ICICI, Easebuzz, and COD). Private secret keys are automatically stripped.

```bash
curl --location --request GET 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/payment-gateways' \
--header 'X-Shopfront-Token: your_storefront_access_token'
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "provider": "razorpay",
      "name": "Razorpay Secure Checkout",
      "display_title": "Razorpay (Cards, UPI, Netbanking, Wallets)",
      "is_test_mode": true,
      "public_credentials": {
        "key_id": "rzp_test_1234567890abcdef"
      },
      "metadata": {
        "icon": "razorpay",
        "description": "Pay securely via UPI, Credit/Debit Cards, NetBanking"
      }
    },
    {
      "provider": "icici",
      "name": "ICICI Bank Eazypay",
      "display_title": "ICICI Eazypay Payment Gateway",
      "is_test_mode": false,
      "public_credentials": {
        "merchant_id": "100000000000123"
      },
      "metadata": {
        "icon": "icici",
        "description": "Direct checkout with ICICI Bank Eazypay & UPI"
      }
    },
    {
      "provider": "easebuzz",
      "name": "Easebuzz",
      "display_title": "Easebuzz Payments",
      "is_test_mode": true,
      "public_credentials": {
        "key": "2PBP7IABZ2"
      },
      "metadata": {
        "icon": "easebuzz",
        "description": "Seamless payments via Easebuzz Gateway"
      }
    },
    {
      "provider": "cod",
      "name": "Cash on Delivery",
      "display_title": "Cash on Delivery (COD)",
      "is_test_mode": false,
      "public_credentials": {},
      "metadata": {
        "icon": "cod",
        "min_order_amount": 0,
        "max_order_amount": 50000,
        "extra_fee": 0,
        "instructions": "Pay cash upon package delivery."
      }
    }
  ]
}
```

---

## 3. Step 1: Customer Enters Checkout (Sync Abandoned Checkout)

When the customer fills in contact and shipping details and clicks **Proceed to Payment**, sync an **abandoned checkout session**. If the user drops off or payment fails, this record tracks the cart.

```bash
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/abandoned/sync' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--data-raw '{
    "sessionId": "session_chk_987654321",
    "customer": {
        "name": "Rahul Sharma",
        "phone": "+919876543210",
        "email": "rahul.sharma@example.com"
    },
    "shipping_address": {
        "address1": "Flat 402, Sunshine Heights",
        "address2": "MG Road",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "country": "India"
    },
    "items": [
      {
        "productId": 12,
        "variantId": 34,
        "title": "Premium Silk Scarf",
        "price": 999.00,
        "quantity": 2
      }
    ],
    "subtotal": 1998.00,
    "discount": 0.00,
    "shipping": 100.00,
    "tax": 99.90,
    "tax_lines": [
      {
        "name": "CGST",
        "rate": 2.5,
        "amount": 49.95
      },
      {
        "name": "SGST",
        "rate": 2.5,
        "amount": 49.95
      }
    ],
    "total": 2197.90,
    "currency": "INR",
    "utm_source": "google_ads",
    "device_type": "mobile"
}'
```

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Abandoned checkout synced successfully",
  "data": {
    "id": 450,
    "order_number": "CHK-450",
    "session_id": "session_chk_987654321",
    "status": "abandoned"
  }
}
```

---

## 4. Step 2: Initiate Payment

Customer selects their preferred payment method (**Razorpay**, **ICICI**, **Easebuzz**, or **COD**).

---

### 4.1 Option A: Initiate Razorpay Payment
```bash
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/initiate-payment' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--data-raw '{
    "order_id": 450,
    "provider": "razorpay",
    "customer": {
        "name": "Rahul Sharma",
        "email": "rahul.sharma@example.com",
        "phone": "+919876543210"
    }
}'
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "provider": "razorpay",
    "payment_id": 890,
    "order_id": 450,
    "order_number": "CHK-450",
    "amount": 219790,
    "currency": "INR",
    "key_id": "rzp_test_1234567890abcdef",
    "razorpay_order_id": "order_OD123456789",
    "customer_name": "Rahul Sharma",
    "customer_email": "rahul.sharma@example.com",
    "customer_phone": "+919876543210"
  }
}
```
*(The frontend opens the Razorpay Modal with `razorpay_order_id` and `key_id`).*

---

### 4.2 Option B: Initiate ICICI Bank Eazypay Payment
```bash
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/initiate-payment' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--data-raw '{
    "order_id": 450,
    "provider": "icici",
    "return_url": "https://your-store.com/checkout/callback/icici",
    "customer": {
        "name": "Rahul Sharma",
        "email": "rahul.sharma@example.com",
        "phone": "+919876543210"
    }
}'
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "provider": "icici",
    "payment_id": 891,
    "order_id": 450,
    "order_number": "CHK-450",
    "payment_url": "https://eazypayuat.icicibank.com/EazyPG?merchantid=100000000000123&mandatory+fields=...",
    "service_url": "https://eazypayuat.icicibank.com/EazyPG",
    "form_payload": {
      "merchantid": "100000000000123",
      "mandatory fields": "encrypted_mandatory_string...",
      "optional fields": "encrypted_optional_string...",
      "returnurl": "encrypted_return_url...",
      "Reference No": "encrypted_ref_no...",
      "submerchantid": "encrypted_submerchant_id...",
      "transaction amount": "encrypted_amount...",
      "paymode": "encrypted_paymode..."
    }
  }
}
```
*(The frontend redirects or posts the form to `service_url`).*

---

### 4.3 Option C: Initiate Easebuzz Payment
```bash
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/initiate-payment' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--data-raw '{
    "order_id": 450,
    "provider": "easebuzz",
    "return_url": "https://your-store.com/checkout/callback/easebuzz",
    "customer": {
        "name": "Rahul Sharma",
        "email": "rahul.sharma@example.com",
        "phone": "+919876543210"
    }
}'
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "provider": "easebuzz",
    "payment_id": 892,
    "order_id": 450,
    "order_number": "CHK-450",
    "access_key": "98a76bc54ef321",
    "checkout_url": "https://testpay.easebuzz.in/pay/98a76bc54ef321",
    "txnid": "TXN_450_892_1730000000"
  }
}
```
*(The frontend opens Easebuzz Checkout iframe/modal or redirects to `checkout_url`).*

---

### 4.4 Option D: Place Cash on Delivery (COD) Order
```bash
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/initiate-payment' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--data-raw '{
    "order_id": 450,
    "provider": "cod"
}'
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "provider": "cod",
    "payment_id": 893,
    "order_id": 450,
    "order_number": "ORD-450",
    "message": "Order placed with Cash on Delivery."
  }
}
```
*(Order status is set to `placed`, `financial_status: 'pending'`, confirmation email & WhatsApp sent).*

---

## 5. Step 3: Payment Success Verification (Creates/Settles Paid Order)

When the online payment gateway successfully captures the customer's funds, the gateway provides verification signatures / callback parameters. Send this payload to verify and transition the order to **`financial_status: 'paid'`**.

---

### 5.1 Verify Razorpay Payment
```bash
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/verify-payment' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--data-raw '{
    "provider": "razorpay",
    "order_id": 450,
    "payment_id": 890,
    "razorpay_order_id": "order_OD123456789",
    "razorpay_payment_id": "pay_P1234567890",
    "razorpay_signature": "9ef35687a02b1c3d4e5f60718293a4b5c6d7e8f90123456789abcdef01234567"
}'
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "order_id": 450,
    "payment_id": 890
  }
}
```
*(The backend verifies the cryptographic HMAC signature, sets `orders.financial_status = 'paid'`, records capture transaction, and sends email & WhatsApp order receipts).*

---

### 5.2 Verify ICICI Bank Callback
```bash
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/verify-payment' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--data-raw '{
    "provider": "icici",
    "order_id": 450,
    "payment_id": 891,
    "Response Code": "E000",
    "Unique Ref Number": "ICICI_TXN_998877",
    "ReferenceNo": "ORD450_891",
    "Transaction Amount": "2197.90"
}'
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "order_id": 450,
    "payment_id": 891
  }
}
```

---

### 5.3 Verify Easebuzz Callback
```bash
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/verify-payment' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: your_storefront_access_token' \
--data-raw '{
    "provider": "easebuzz",
    "order_id": 450,
    "payment_id": 892,
    "status": "success",
    "txnid": "TXN_450_892_1730000000",
    "amount": "2197.90",
    "firstname": "Rahul",
    "email": "rahul.sharma@example.com",
    "productinfo": "Order CHK-450",
    "hash": "7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
}'
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "order_id": 450,
    "payment_id": 892
  }
}
```

---

## 6. Payment Failed / Dismissed (No Paid Order Created)

If the customer dismisses the payment modal or the card is declined:
1. **DO NOT** call `/verify-payment`.
2. The initial record created in Step 3 remains in **`status: 'abandoned'`** with `financial_status: 'pending'`.
3. Store staff and automated abandoned checkout recoveries can reach out to the customer via WhatsApp/Email to complete payment.

---
<!-- 
## 7. Server-to-Server Gateway Webhooks

In case the customer closes their browser before redirecting back to the store, configure your webhook endpoints in the respective payment gateway dashboards:

### 7.1 Razorpay Webhook
- **Webhook URL**: `POST https://megaecomm.megascale.co.in/backend/api/payments/webhooks/razorpay`
- **Events**: `order.paid`, `payment.captured`

### 7.2 Easebuzz Webhook
- **Webhook URL**: `POST https://megaecomm.megascale.co.in/backend/api/payments/webhooks/easebuzz`

### 7.3 ICICI Return Callback
- **Callback URL**: `POST https://megaecomm.megascale.co.in/backend/api/payments/callback/icici` -->
