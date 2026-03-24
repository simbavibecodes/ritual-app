// api/images.js

// Extract Open Graph meta tags from HTML
function getOGTag(html, prop) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

// For Sephora URLs, construct image URL directly from skuId — no scraping needed
function sephoraImageFromUrl(link) {
  try {
    const url = new URL(link);
    if (!url.hostname.includes("sephora.com")) return null;
    const skuId = url.searchParams.get("skuId");
    if (!skuId) return null;
    return `https://www.sephora.com/productimages/sku/s${skuId}-main-zoom.jpg`;
  } catch {
    return null;
  }
}

async function scrapeFromLink(link) {
  try {
    const res = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      console.error("Scrape fetch failed:", res.status, link);
      return null;
    }
    const html = await res.text();
    return getOGTag(html, "image");
  } catch (e) {
    console.error("Scrape error:", e.message);
    return null;
  }
}

async function bingImageSearch(query, apiKey) {
  const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(query + " beauty product")}&count=5&imageType=Photo`;
  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Bing error:", res.status, JSON.stringify(data));
    return null;
  }
  const values = data.value || [];
  return values[0]?.contentUrl || null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, brand, link } = req.body;

  const bingApiKey = process.env.BING_API_KEY;
  const productLabel = [brand, name].filter(Boolean).join(" ");

  let imageUrl = null;

  // ── 1. Sephora direct image URL ──
  if (link) {
    imageUrl = sephoraImageFromUrl(link);
    if (imageUrl) console.log("Got image from Sephora CDN:", imageUrl);
  }

  // ── 2. OG tag scrape (non-Sephora links) ──
  if (!imageUrl && link) {
    imageUrl = await scrapeFromLink(link);
    if (imageUrl) console.log("Got image from scrape:", imageUrl);
  }

  // ── 3. Bing Image Search (no link, or link yielded no image) ──
  if (!imageUrl && productLabel && bingApiKey) {
    try {
      imageUrl = await bingImageSearch(productLabel, bingApiKey);
      if (imageUrl) console.log("Got image from Bing:", imageUrl);
    } catch (e) {
      console.error("Bing image search error:", e.message);
    }
  }

  if (!imageUrl) return res.status(200).json({ success: false, message: "No image found" });

  return res.status(200).json({ success: true, imageUrl });
};
