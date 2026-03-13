// api/images.js
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { productId, userId, name, brand } = req.body;
  if (!productId || !userId) return res.status(400).json({ error: "productId and userId required" });

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  let imageUrl = null;
  const productLabel = [brand, name].filter(Boolean).join(" ");

  // ── 1. Google Custom Search image search ──
  if (googleApiKey && searchEngineId) {
    try {
      const query = encodeURIComponent(productLabel + " beauty product");
      const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${query}&searchType=image&num=5&imgType=photo`;
      console.log("Google URL:", googleUrl.replace(googleApiKey, "REDACTED"));
      const referer =
        req.headers.origin ||
        (req.headers.host ? `https://${req.headers.host}` : null);
      const googleRes = await fetch(googleUrl, {
        headers: referer ? { Referer: referer } : {},
      });
      const data = await googleRes.json();
      if (googleRes.ok) {
        const items = data.items || [];
        // Prefer Sephora images
        const best = items.find(i => i.link?.includes("sephora")) || items[0];
        if (best?.link) imageUrl = best.link;
      } else {
        const reason = data?.error?.errors?.[0]?.reason || "unknown";
        console.error("Google error:", googleRes.status, reason, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Google image search error:", e.message);
    }
  }

  // ── 2. Fallback: Open Beauty Facts ──
  if (!imageUrl && name) {
    try {
      const query = encodeURIComponent(productLabel);
      const obfRes = await fetch(`https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=5`);
      if (obfRes.ok) {
        const data = await obfRes.json();
        const product = (data.products || []).find(p => p.image_front_url || p.image_url);
        if (product) imageUrl = product.image_front_url || product.image_url;
      }
    } catch (e) {
      console.error("Open Beauty Facts error:", e.message);
    }
  }

  if (!imageUrl) return res.status(200).json({ success: false, message: "No image found" });

  // ── 3. Save to Supabase ──
  try {
    await supabaseAdmin.from("products").update({ image: imageUrl }).eq("id", productId).eq("user_id", userId);
    return res.status(200).json({ success: true, imageUrl });
  } catch (e) {
    console.error("Supabase update error:", e);
    return res.status(500).json({ error: "Failed to save image" });
  }
}
