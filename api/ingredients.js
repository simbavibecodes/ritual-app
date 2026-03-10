// api/ingredients.js
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, brand, category, globalProductId } = req.body;
  if (!name) return res.status(400).json({ error: "Product name required" });

  // ── 1. Check global DB by ID ──
  if (globalProductId && supabaseAdmin) {
    const { data: existing } = await supabaseAdmin
      .from("global_products")
      .select("id, ingredients, ingredients_raw, search_count")
      .eq("id", globalProductId)
      .single();

    if (existing?.ingredients?.length > 0) {
      await supabaseAdmin.from("global_products")
        .update({ search_count: existing.search_count + 1, last_verified: new Date().toISOString() })
        .eq("id", globalProductId);
      return res.status(200).json({
        source: "cache",
        globalProductId: existing.id,
        ingredients: existing.ingredients,
        ingredientsRaw: existing.ingredients_raw,
      });
    }
  }

  // ── 2. Check by name+brand ──
  if (supabaseAdmin) {
    const { data: nameMatch } = await supabaseAdmin
      .from("global_products")
      .select("id, ingredients, ingredients_raw, search_count")
      .ilike("name", name.trim())
      .ilike("brand", (brand || "").trim())
      .limit(1)
      .maybeSingle();

    if (nameMatch?.ingredients?.length > 0) {
      await supabaseAdmin.from("global_products")
        .update({ search_count: nameMatch.search_count + 1, last_verified: new Date().toISOString() })
        .eq("id", nameMatch.id);
      return res.status(200).json({
        source: "cache",
        globalProductId: nameMatch.id,
        ingredients: nameMatch.ingredients,
        ingredientsRaw: nameMatch.ingredients_raw,
      });
    }
  }

  // ── 3. Web search via Claude ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const productLabel = [brand, name].filter(Boolean).join(" ");
  const prompt = `Look up the ingredients list for the beauty/skincare/haircare product: "${productLabel}".
Find the official INCI ingredients list from the brand's website or a reliable source.
Respond ONLY with this exact JSON (no markdown):
{
  "ingredients": ["ingredient1", "ingredient2"],
  "ingredients_raw": "Full ingredients text as found on label",
  "confidence": "high|medium|low"
}
If you cannot find it, return {"ingredients": [], "ingredients_raw": "", "confidence": "low"}`;

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error("Claude error:", err);
      return res.status(502).json({ error: "Ingredient lookup failed" });
    }

    const data = await claudeRes.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    let ingredients = [], ingredientsRaw = "", confidence = "low";
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        ingredients = parsed.ingredients || [];
        ingredientsRaw = parsed.ingredients_raw || "";
        confidence = parsed.confidence || "low";
      } catch(e) {}
    }

    // ── 4. Save to global_products ──
    let savedId = null;
    if (ingredients.length > 0 && supabaseAdmin) {
      const { data: saved, error: saveErr } = await supabaseAdmin
        .from("global_products")
        .insert({ name: name.trim(), brand: (brand||"").trim(), category: category||"skin",
          ingredients, ingredients_raw: ingredientsRaw, search_count: 1,
          last_verified: new Date().toISOString() })
        .select("id").single();
      if (!saveErr) savedId = saved.id;
    }

    return res.status(200).json({ source: "search", globalProductId: savedId, ingredients, ingredientsRaw, confidence });

  } catch(e) {
    console.error("Ingredients API error:", e);
    return res.status(500).json({ error: "Server error", details: e.message });
  }
}
