// /api/vf.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const VF_API_KEY = process.env.VF_API_KEY;
  const VF_VERSION = process.env.VF_VERSION || "production";
  if (!VF_API_KEY) return res.status(500).send("Missing VF_API_KEY");

  try {
    const { userId, text } = req.body || {};
    if (!userId) return res.status(400).send("Missing userId");

    const fetch = (await import("node-fetch")).default;
    const action = text === "__LAUNCH__"
      ? { type: "launch" }
      : { type: "text", payload: String(text || "") };

    const url = `https://general-runtime.voiceflow.com/state/${encodeURIComponent(VF_VERSION)}/user/${encodeURIComponent(userId)}/interact`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": VF_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action, config: { stripSSML: true } })
    });
    if (!r.ok) return res.status(500).send(await r.text());

    const traces = await r.json();
    const messages = [];
    for (const t of traces) {
      if (t.type === "speak" && t.payload?.message) messages.push(t.payload.message);
      else if (t.type === "text" && typeof t.payload === "string") messages.push(t.payload);
    }
    return res.status(200).json(messages);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
}
