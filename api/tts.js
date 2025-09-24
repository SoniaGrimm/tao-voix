// /api/tts.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const UNREAL_API_KEY = process.env.UNREAL_API_KEY;
  if (!UNREAL_API_KEY) return res.status(500).send("Missing UNREAL_API_KEY");

  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).send("Missing text");

    const fetch = (await import("node-fetch")).default;
    const r = await fetch("https://api.v7.unrealspeech.com/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${UNREAL_API_KEY}`
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Maya", // voix FR dispo
        Bitrate: "192k",
        Speed: "1.0",
        Pitch: "1.0",
        Codec: "mp3"
      })
    });

 if (!r.ok) { 
  console.error("TTS error", await r.text()); 
  return; 
}

    const arrayBuf = await r.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buf);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
}
