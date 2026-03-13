// api/images.js
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
    return {
      image: getOGTag(html, "image"),
      title: getOGTag(html, "title"),
      siteName: getOGTag(html, "site_name"),
    };
  } catch (e) {
    console.error("Scrape error:", e.message);
    return null;
  }
}

async function googleImageSearch(query, apiKey, searchEngineId) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query + " beauty product")}&searchType=image&num=5&imgType=photo`;
  console.log("Google search:", url.replace(apiKey, "REDACTED"));
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const reason = data?.error?.errors?.[0]?.reason || "unknown";
    console.error("Google error:", res.status, reason, JSON.stringify(data));
    return null;
  }
  const items = data.items || [];
  const best = items.find(i => i.link?.includes("sephora")) || items[0];
  return best?.link || null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { productId, userId, name, brand, link } = req.body;
  if (!productId || !userId) return res.status(400).json({ error: "productId and userId required" });

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const productLabel = [brand, name].filter(Boolean).join(" ");

  let imageUrl = null;
  let scrapedName = null;
  let scrapedBrand = null;

  // ── 1. Scrape from product link ──
  if (link) {
    const scraped = await scrapeFromLink(link);
    if (scraped?.image) {
      imageUrl = scraped.image;
      console.log("Got image from link scrape:", imageUrl);
    }
    // Use scraped title/brand only if not already provided by user
    if (scraped?.title && !name) scrapedName = scraped.title;
    if (scraped?.siteName && !brand) scrapedBrand = scraped.siteName;
  }

  // ── 2. Google image search ──
  if (!imageUrl && productLabel && googleApiKey && searchEngineId) {
    try {
      imageUrl = await googleImageSearch(productLabel, googleApiKey, searchEngineId);
      if (imageUrl) console.log("Got image from Google:", imageUrl);
    } catch (e) {
      console.error("Google image search error:", e.message);
    }
  }

  // ── 3. Open Beauty Facts fallback ──
  if (!imageUrl && name) {
    try {
      const obfRes = await fetch(`https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(productLabel)}&search_simple=1&action=process&json=1&page_size=5`);
      if (obfRes.ok) {
        const data = await obfRes.json();
        const product = (data.products || []).find(p => p.image_front_url || p.image_url);
        if (product) {
          imageUrl = product.image_front_url || product.image_url;
          console.log("Got image from Open Beauty Facts:", imageUrl);
        }
      }
    } catch (e) {
      console.error("Open Beauty Facts error:", e.message);
    }
  }

  if (!imageUrl) return res.status(200).json({ success: false, message: "No image found" });

  // ── 4. Save to Supabase ──
  try {
    const update = { image: imageUrl };
    if (scrapedName) update.name = scrapedName;
    if (scrapedBrand) update.brand = scrapedBrand;
    await supabaseAdmin.from("products").update(update).eq("id", productId).eq("user_id", userId);
    return res.status(200).json({ success: true, imageUrl, scrapedName, scrapedBrand });
  } catch (e) {
    console.error("Supabase update error:", e);
    return res.status(500).json({ error: "Failed to save image" });
  }
};
