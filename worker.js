// Cloudflare Worker: phát index.html + proxy gọi Gemini (khóa nằm trong secret GEMINI_API_KEY)
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/api/ai") {
      if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      const origin = req.headers.get("Origin");
      if (origin && new URL(origin).host !== url.host) return Response.json({ error: "Forbidden" }, { status: 403 });
      if (!env.GEMINI_API_KEY) return Response.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });
      let body; try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
      const prompt = String(body.prompt || "").slice(0, 6000);
      if (!prompt) return Response.json({ error: "Thiếu prompt" }, { status: 400 });
      const model = env.GEMINI_MODEL || "gemini-2.5-flash";
      const payload = { contents: [{ parts: [{ text: prompt }] }] };
      if (body.json) payload.generationConfig = { responseMimeType: "application/json" };
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!r.ok) return Response.json({ error: j.error?.message || "Lỗi Gemini" }, { status: 502 });
      const text = j.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
      return Response.json({ text });
    }
    return env.ASSETS.fetch(req); // phát index.html
  }
};
