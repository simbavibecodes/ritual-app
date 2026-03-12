// api/images.js
// Fetches product image from:
// 1. og:image meta tag from the product link (Sephora, Ulta, etc.)
// 2. Open Beauty Facts as fallback
// Saves result to products.image in Supabase

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
console.log("ENV CHECK - SUPABASE_URL:", supabaseUrl ? supabaseUrl.slice(0,30) + "..." : "MISSING");
console.log("ENV CHECK - SERVICE_KEY:", supabaseKey ? "present" : "MISSING");

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { productId, userId, link, name, brand } = req.body;
  if (!productId || !userId) return res.status(400).json({ error: "productId and userId required" });

  let imageUrl = null;

  // ── 1. Try og:image from product link ──
  if (link) {
    try {
      const response = await fetch(link, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RitualHQ/1.0; +https://ritualhq.app)",
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const html = await response.text();

        // Extract og:image
        const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

        if (ogMatch?.[1]) {
          imageUrl = ogMatch[1];
          // Make sure it's absolute
          if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl;
        }
      }
    } catch (e) {
      console.error("og:image fetch error:", e.message);
    }
  }

  // ── 2. Fallback: Open Beauty Facts by name+brand ──
  if (!imageUrl && name) {
    try {
      const query = encodeURIComponent([brand, name].filter(Boolean).join(" "));
      const obfRes = await fetch(
        `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=5`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (obfRes.ok) {
        const data = await obfRes.json();
        const product = (data.products || []).find(p => p.image_url || p.image_front_url);
        if (product) {
          imageUrl = product.image_front_url || product.image_url;
        }
      }
    } catch (e) {
      console.error("Open Beauty Facts error:", e.message);
    }
  }

  if (!imageUrl) {
    return res.status(200).json({ success: false, message: "No image found" });
  }

  // ── 3. Save to Supabase ──
  try {
    await supabaseAdmin
      .from("products")
      .update({ image: imageUrl })
      .eq("id", productId)
      .eq("user_id", userId);

    return res.status(200).json({ success: true, imageUrl });
  } catch (e) {
    console.error("Supabase update error:", e);
    return res.status(500).json({ error: "Failed to save image" });
  }
}
