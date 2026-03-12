// api/images.js
// Fetches product image using Google Custom Search Image API
// Falls back to Open Beauty Facts if Google finds nothing
// Saves result to products.image in Supabase

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { productId, userId, name, brand } = req.body;
  if (!productId || !userId) return res.status(400).json({ error: "productId and userId required" });

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!googleApiKey || !searchEngineId) {
    return res.status(500).json({ error: "Google API not configured" });
  }

  let imageUrl = null;
  const productLabel = [brand, name].filter(Boolean).join(" ");

  // ── 1. Google Custom Search — Sephora first ──
  try {
    const query = encodeURIComponent(`${productLabel} site:sephora.com`);
    const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${query}&searchType=image&num=3&imgType=photo&imgSize=medium`;
    const googleRes = await fetch(googleUrl);
    if (googleRes.ok) {
      const data = await googleRes.json();
      const items = data.items || [];
      const sephoraItem = items.find(item => item.link?.includes("sephora") || item.image?.contextLink?.includes("sephora"));
      const best = sephoraItem || items[0];
      if (best?.link) imageUrl = best.link;
    } else {
      console.error("Google Search error:", googleRes.status, await googleRes.text());
    }
  } catch (e) {
    console.error("Google image search error:", e.message);
  }

  // ── 2. Fallback: broader Google search ──
  if (!imageUrl) {
    try {
      const query = encodeURIComponent(`${productLabel} beauty product`);
      const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${query}&searchType=image&num=3&imgType=photo`;
      const googleRes = await fetch(googleUrl);
      if (googleRes.ok) {
        const data = await googleRes.json();
        const item = (data.items || [])[0];
        if (item?.link) imageUrl = item.link;
      }
    } catch (e) {
      console.error("Google fallback error:", e.message);
    }
  }

  // ── 3. Last resort: Open Beauty Facts ──
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

  // ── 4. Save to Supabase ──
  try {
    await supabaseAdmin.from("products").update({ image: imageUrl }).eq("id", productId).eq("user_id", userId);
    return res.status(200).json({ success: true, imageUrl });
  } catch (e) {
    console.error("Supabase update error:", e);
    return res.status(500).json({ error: "Failed to save image" });
  }
}
