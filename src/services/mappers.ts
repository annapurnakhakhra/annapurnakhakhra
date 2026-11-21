import { API_BASE_URL } from '../config/api';
import type { Product } from '../types';

export function normalizeImageUrl(urlInput: string): string {
  if (!urlInput || typeof urlInput !== 'string') return '';
  let url = urlInput.trim();
  if (!url) return '';

  if (url.startsWith('//')) {
    url = `https:${url}`;
  }

  if (url.match(/^https?:\/\/[^\/]+\/media\//)) {
    url = url.replace(/^https?:\/\/[^\/]+\/media\//, `${API_BASE_URL}/api/media/`);
  } else if (url.match(/^https?:\/\/[^\/]+\/api\/media\//)) {
    url = url.replace(/^https?:\/\/[^\/]+\/api\/media\//, `${API_BASE_URL}/api/media/`);
  } else if (url.startsWith('/media/')) {
    url = `${API_BASE_URL}/api${url}`;
  } else if (url.startsWith('/') && !url.startsWith('//')) {
    url = `${API_BASE_URL}${url}`;
  }

  return url;
}

export function mapProductToUI(backendProduct: any): Product {
  if (!backendProduct) return {} as Product;

  const id = backendProduct.product_id || backendProduct.productId || backendProduct.id || backendProduct._id || `gid://shopify/Product/${Math.random().toString(36).substr(2, 9)}`;
  const title = backendProduct.product_title || backendProduct.product_name || backendProduct.productTitle || backendProduct.title || backendProduct.name || 'Premium Khakhra';
  const handle = backendProduct.handle || backendProduct.slug || backendProduct.identifier || title.toLowerCase().replace(/\s+/g, '-');

  const basePrice = Number(
    backendProduct.price?.amount ||
    backendProduct.price ||
    backendProduct.priceRange?.minVariantPrice?.amount ||
    backendProduct.variants?.[0]?.price?.amount ||
    backendProduct.variants?.[0]?.price ||
    backendProduct.selling_price ||
    backendProduct.unit_price ||
    180
  );
  const comparePrice = Number(
    backendProduct.compareAtPrice?.amount ||
    backendProduct.compareAtPrice ||
    backendProduct.compare_at_price ||
    backendProduct.variants?.[0]?.compareAtPrice?.amount ||
    backendProduct.variants?.[0]?.compareAtPrice ||
    0
  );

  // Standardize featured image
  let rawFeatured =
    backendProduct.product_image ||
    backendProduct.productImage ||
    backendProduct.featuredImage ||
    backendProduct.featured_image ||
    backendProduct.image ||
    backendProduct.image_url ||
    backendProduct.featuredImageUrl ||
    (Array.isArray(backendProduct.images) ? backendProduct.images[0] : null);

  let urlStr = '';
  if (rawFeatured) {
    let nodeObj = rawFeatured.node || rawFeatured;
    urlStr = typeof nodeObj === 'string' ? nodeObj : nodeObj.url || nodeObj.src || nodeObj.originalSrc || nodeObj.image_url || '';
  }

  const normalizedUrl = normalizeImageUrl(urlStr) || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80';

  // Map all product images if available
  let allImages: { url: string; altText?: string }[] = [];
  if (Array.isArray(backendProduct.images) && backendProduct.images.length > 0) {
    allImages = backendProduct.images
      .map((img: any) => {
        const rawUrl = typeof img === 'string' ? img : img?.url || img?.src || img?.image_url || img?.originalSrc || '';
        const norm = normalizeImageUrl(rawUrl);
        return norm ? { url: norm, altText: img?.alt_text || img?.altText || title } : null;
      })
      .filter(Boolean) as { url: string; altText?: string }[];
  }

  if (allImages.length === 0 && normalizedUrl) {
    allImages = [{ url: normalizedUrl, altText: title }];
  } else if (normalizedUrl && !allImages.some((img) => img.url === normalizedUrl)) {
    allImages.unshift({ url: normalizedUrl, altText: title });
  }

  const totalInventory =
    backendProduct.total_inventory !== undefined && backendProduct.total_inventory !== null
      ? Number(backendProduct.total_inventory)
      : backendProduct.inventory_quantity !== undefined && backendProduct.inventory_quantity !== null
        ? Number(backendProduct.inventory_quantity)
        : backendProduct.variants?.[0]?.inventoryQuantity !== undefined && backendProduct.variants[0].inventoryQuantity !== null
          ? Number(backendProduct.variants[0].inventoryQuantity)
          : undefined;

  const isAvailable =
    totalInventory !== undefined
      ? totalInventory > 0
      : backendProduct.availableForSale !== undefined
        ? Boolean(backendProduct.availableForSale)
        : backendProduct.is_available !== undefined
          ? Boolean(backendProduct.is_available)
          : backendProduct.variants?.[0]?.availableForSale !== undefined
            ? Boolean(backendProduct.variants[0].availableForSale)
            : true;

  const mappedVariants = Array.isArray(backendProduct.variants) && backendProduct.variants.length > 0
    ? backendProduct.variants.map((v: any) => {
      const rawVPrice = v.price?.amount !== undefined ? v.price.amount : v.price !== undefined ? v.price : basePrice;
      const vPrice = Number(rawVPrice) || basePrice;

      const rawVCompare =
        v.compare_at_price?.amount !== undefined
          ? v.compare_at_price.amount
          : v.compare_at_price !== undefined
            ? v.compare_at_price
            : v.compareAtPrice?.amount !== undefined
              ? v.compareAtPrice.amount
              : v.compareAtPrice !== undefined
                ? v.compareAtPrice
                : undefined;
      const vComparePrice = rawVCompare !== undefined && rawVCompare !== null ? Number(rawVCompare) : undefined;

      const vInv =
        v.inventory_quantity !== undefined && v.inventory_quantity !== null
          ? Number(v.inventory_quantity)
          : v.inventoryQuantity !== undefined && v.inventoryQuantity !== null
            ? Number(v.inventoryQuantity)
            : undefined;

      const vAvailable =
        vInv !== undefined
          ? vInv > 0
          : v.availableForSale !== undefined
            ? Boolean(v.availableForSale)
            : v.is_available !== undefined
              ? Boolean(v.is_available)
              : isAvailable;

      return {
        id: String(v.id || `var_${id}`),
        title: v.title || 'Standard Pack',
        price: vPrice.toFixed(2),
        compareAtPrice: vComparePrice && vComparePrice > vPrice ? vComparePrice.toFixed(2) : undefined,
        availableForSale: vAvailable,
        inventoryQuantity: vInv !== undefined ? vInv : totalInventory,
        selectedOptions: v.selectedOptions || [],
      };
    })
    : [
      {
        id: backendProduct.default_variant_id || `gid://shopify/ProductVariant/${id}`,
        title: '250g Pack',
        price: basePrice.toFixed(2),
        availableForSale: isAvailable,
        inventoryQuantity: totalInventory,
      },
    ];

  return {
    id: String(id),
    title,
    handle,
    description: backendProduct.description || 'Authentic slow-roasted handcrafted Gujarati khakhra.',
    price: basePrice,
    compareAtPrice: comparePrice > basePrice ? comparePrice : undefined,
    images: allImages,
    category: backendProduct.productType || backendProduct.category || 'Traditional',
    rating: backendProduct.avg_rating || 4.9,
    reviewsCount: backendProduct.total_reviews || 48,
    total_inventory: totalInventory !== undefined ? totalInventory : (isAvailable ? 10 : 0),
    availableForSale: isAvailable,
    variants: mappedVariants,
  };
}
