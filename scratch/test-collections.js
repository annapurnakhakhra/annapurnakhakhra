const BASE_URL = "http://10.27.1.208:4000";
const TOKEN = process.env.NEXT_PUBLIC_SHOPFRONT_TOKEN;

async function testFetch() {
  if (!TOKEN) {
    throw new Error("Set NEXT_PUBLIC_SHOPFRONT_TOKEN before running this script.");
  }

  try {
    const url = `${BASE_URL}/api/shop/collections`;
    console.log(`Fetching from: ${url}`);
    const res = await fetch(url, {
      headers: {
        "x-shopfront-token": TOKEN
      }
    });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log("Collections:", JSON.stringify(data).substring(0, 500) + "...");

    if (data.success && data.data && data.data.length > 0) {
      const collectionId = data.data[0].id;
      const detailUrl = `${BASE_URL}/api/shop/collections/${collectionId}`;
      console.log(`Fetching detail from: ${detailUrl}`);
      const detailRes = await fetch(detailUrl, {
        headers: {
          "x-shopfront-token": TOKEN
        }
      });
      const detailData = await detailRes.json();
      console.log("Collection Detail Keys:", Object.keys(detailData.data || {}));
      console.log("Collection Detail Snippet:", JSON.stringify(detailData).substring(0, 2000) + "...");
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testFetch();
