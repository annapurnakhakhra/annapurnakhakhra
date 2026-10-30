const http = require('http');

const options = {
  hostname: '10.27.1.208',
  port: 4000,
  path: '/api/shop/products?limit=50',
  method: 'GET',
  headers: {
  'x-shopfront-token': process.env.NEXT_PUBLIC_SHOPFRONT_TOKEN
  }
};

if (!options.headers['x-shopfront-token']) {
  throw new Error('Set NEXT_PUBLIC_SHOPFRONT_TOKEN before running this script.');
}

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const products = json.data || json.products || [];
      const summary = products.map(p => ({
        title: p.title,
        handle: p.handle,
        variants: p.variants
      }));
      console.log(JSON.stringify(summary, null, 2));
    } catch (e) {
      console.log("Raw output:", data);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
