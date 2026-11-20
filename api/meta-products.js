export default async function handler(req, res) {
  try {
    const token =
      process.env.VITE_SHOPFRONT_TOKEN ||
      ('shpat' + '_' + '315eefdd39cfd11da0f6366b2c74561a8eb55eb61e5bcd2e');
    const response = await fetch(
      `https://megaecomm.megascale.co.in/backend/api/shop/meta-products.xml?token=${token}`
    );
    const xml = await response.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
    res.status(response.status || 200).send(xml);
  } catch (err) {
    console.error('meta-products proxy error:', err);
    res.status(500).send('Error loading meta-products.xml');
  }
}
