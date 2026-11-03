# List all products
curl -X GET "https://megaecomm.megascale.co.in/backend/api/shop/products" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>"

# Get product by ID
curl -X GET "https://megaecomm.megascale.co.in/backend/api/shop/products/2933" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>"

# Get product by Handle
curl -X GET "https://megaecomm.megascale.co.in/backend/api/shop/products/product-handle" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>"


# Get Collection
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/collections' \
--header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# Get Collection By Handle
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/collections/women'\''s-ring' \
--header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# Get Blog
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/cms/blogs' \
--header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# Get Blogs By handle 
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/cms/blogs/news?page=1' \
--header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# Get Blog Post By handle
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/cms/posts/post-slug' \
--header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'


# Send OTP (Authentication)
curl -X POST https://megaecomm.megascale.co.in/backend/api/shop/auth/send-otp \
  -H "Content-Type: application/json" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -d '{
    "email": "customer@example.com"
  }'

# Verify OTP (Authentication)
curl -X POST https://megaecomm.megascale.co.in/backend/api/shop/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -d '{
    "email": "customer@example.com",
    "otp": "123456"
  }'

# Create Customer (For Guest Checkout without login)
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/customers' \
--header 'Content-Type: application/json' \
--header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>' \
--data-raw '{
    "first_name": "Rahul",
    "last_name": "Sharma",
    "email": "rahul.sharma@example.com",
    "phone": "+919876543210",
    "addresses": [
        {
            "first_name": "Rahul",
            "last_name": "Sharma",
            "address1": "Flat 402, Sunshine Heights",
            "address2": "Linking Road, Bandra West",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400050",
            "country": "India",
            "phone": "+919876543210",
            "is_default": true
        }
    ]
}'

# Customer Profile
curl -X GET https://megaecomm.megascale.co.in/backend/api/shop/customer/me \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN"

curl -X PUT https://megaecomm.megascale.co.in/backend/api/shop/customer/profile \
  -H "Content-Type: application/json" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" \
  -d '{
    "first_name": "Shantanu",
    "last_name": "Kolhatkar",
    "email": "shantanu.kolhatkar@example.com"
  }'

# Orders
curl -X GET https://megaecomm.megascale.co.in/backend/api/shop/orders/8 \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN"

# Wishlist
curl -X POST https://megaecomm.megascale.co.in/backend/api/shop/wishlist/toggle \
  -H "Content-Type: application/json" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" \
  -d '{
    "product_id": 2177,
    "variant_id": null
  }'

curl -X DELETE https://megaecomm.megascale.co.in/backend/api/shop/wishlist/15 \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN"

curl -X GET https://megaecomm.megascale.co.in/backend/api/shop/wishlist \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN"

# Customer Addresses
curl -X PUT https://megaecomm.megascale.co.in/backend/api/shop/customer/addresses/5 \
  -H "Content-Type: application/json" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "9876543210",
    "address_line1": "Plot 557, Block A",
    "city": "Surat",
    "state": "Gujarat",
    "pincode": "395006"
  }'

curl -X POST https://megaecomm.megascale.co.in/backend/api/shop/customer/addresses \
  -H "Content-Type: application/json" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" \
  -d '{
    "first_name": "Shantanu",
    "last_name": "Kolhatkar",
    "phone": "918999123868",
    "address_line1": "P-26 Chaitanya Nagari phase two",
    "address_line2": "warje Pune 46 P - Apartment phase two",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "411058",
    "is_default": true
  }'

curl -X PUT https://megaecomm.megascale.co.in/backend/api/shop/customer/addresses/18 \
  -H "Content-Type: application/json" \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" \
  -d '{
    "first_name": "Shantanu",
    "last_name": "Kolhatkar",
    "phone": "918999123868",
    "address_line1": "Flat 402, Block B, Chaitanya Nagari",
    "address_line2": "Near Warje Flyover",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "411058"
  }'

curl -X PATCH https://megaecomm.megascale.co.in/backend/api/shop/customer/addresses/18/default \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN"

curl -X GET https://megaecomm.megascale.co.in/backend/api/shop/customer/addresses \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN"

curl -X DELETE https://megaecomm.megascale.co.in/backend/api/shop/customer/addresses/18 \
  -H "X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>" \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN"

# Store Info
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/info' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# Shipping Rates
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/shipping/rates' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>' \
  --header 'Content-Type: application/json' \
  --data '{
    "address": {
        "country": "India",
        "state": "Maharashtra",
        "pincode": "400001",
        "city": "Mumbai"
    },
    "order_amount": 1998.00,
    "items": [
        {
            "variant_id": 34,
            "quantity": 2
        }
    ]
}'

# Validate Discount Coupon
curl --location --request POST 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/validate-coupon' \
  --header 'Content-Type: application/json' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>' \
  --data-raw '{
    "code": "SAVE20",
    "order_amount": 1998.00
}'

# Payment Gateways
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/checkout/payment-gateways' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# Pincode Auto-Lookup (City, State, Country)
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/pincode/380001' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# Customer Wishlist (Requires Customer Token)

# 1. Get Wishlist
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/wishlist' \
  --header 'Authorization: Bearer <CUSTOMER_TOKEN>' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# 2. Toggle Wishlist Item (Add or Remove)
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/wishlist/toggle' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <CUSTOMER_TOKEN>' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>' \
  --data '{
    "product_id": 101,
    "variant_id": 201
  }'

# 3. Delete from Wishlist by ID
curl --location --request DELETE 'https://megaecomm.megascale.co.in/backend/api/shop/wishlist/12' \
  --header 'Authorization: Bearer <CUSTOMER_TOKEN>' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# Product Reviews

# 1. Get Reviews for a Product
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/reviews/product/101?page=1&limit=10' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>'

# 2. Add Review as a Logged-in Customer
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/reviews/customer' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <CUSTOMER_TOKEN>' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>' \
  --data '{
    "product_id": 101,
    "rating": 5,
    "title": "Loved the ring!",
    "description": "Very premium shine and fast delivery.",
    "images": [
      "https://megaecomm.megascale.co.in/backend/media/20/reviews/photo.jpg"
    ]
  }'

# 3. Add Review as Guest / Public
curl --location 'https://megaecomm.megascale.co.in/backend/api/shop/reviews' \
  --header 'Content-Type: application/json' \
  --header 'X-Shopfront-Token: <YOUR_SHOPFRONT_TOKEN>' \
  --data '{
    "product_id": 101,
    "customer_name": "Rohan Patel",
    "rating": 5,
    "title": "Excellent Quality",
    "description": "Looks even better in real life.",
    "images": []
  }'

