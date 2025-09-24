// /api/whisper.js
export const config = { api: { bodyParser: false } };

import formidable from "formidable";
import fs from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).send("Missing OPENAI_API_KEY");

  try {
    const form = formidable({ multiples: false });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) =>
        err ? reject(err) : resolve({ fields, files })
      );
    });

    // récupérer le fichier
    const file = files.file; // 🔑 clé "file" à utiliser
    if (!file) return res.status(400).send("No file uploaded");

    const filepath = file.filepath;
    if (!filepath) return res.status(400).send("Invalid file path");

    const lang = fields.language || "fr";

    const fetch = (await import("node-fetch")).default;
    const FormData = (await import("form-data")).default;

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filepath), {
      filename: file.originalFilename || "speech.webm",
      contentType: file.mimetype || "audio/webm",
    });
    formData.append("model", "whisper-1");
    formData.append("language", lang);

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!r.ok) {
      console.error("Whisper API error:", await r.text());
      return res.status(500).send("Whisper API error");
    }

    const data = await r.json();
    return res.status(200).json({ text: data.text });
  } catch (e) {
    console.error("Server error:", e);
    return res.status(500).send("Server error");
  }
}
