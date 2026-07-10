import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json());

// API: Sanctify Weapon
app.post("/api/sanctify", async (req, res) => {
  try {
    const { weaponId, customName, prefix, userPrayer } = req.body;
    
    const prompt = `You are a Grand Master of the Black Templars (Gothic, zealous space knight order).
The battle-brother requests a Holy Sanctification Litany for their weapon:
Weapon Archetype: ${weaponId || "Bolter"}
Custom Inscription: "${customName || "Unresolved Wrath"}"
Desired Blessing Prefix: "${prefix || "Zealot's Bane"}"
Crusader's Prayer/Intent: "${userPrayer || "To purge the corrupted beasts"}"

Generate a highly immersive Warhammer 40k style response in JSON format.
Include:
1. "litany": A short, intense, zealous 2-sentence battle prayer or blessing to chant while revving or firing the weapon (in Thai, with gothic sci-fi tone).
2. "englishTranslation": The English translation of the litany (gothic, dramatic).
3. "perkName": An epic gothic perk name (e.g., "Holy Incineration", "Righteous Cleave").
4. "perkDescription": A fictional mechanical perk (e.g., "+20% damage against corrupted beasts, projectiles trail holy fire").

Respond ONLY with a valid JSON object matching this schema. Do not include markdown formatting or backticks around the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text.trim()));
  } catch (error: any) {
    console.error("Sanctification error:", error);
    res.status(500).json({
      error: "The forge grew cold. Sanctification failed.",
      details: error.message,
    });
  }
});

// API: Scribe Chronicles
app.post("/api/chronicle", async (req, res) => {
  try {
    const { topic, campaignName, crusaderName } = req.body;
    
    const prompt = `You are the High Scribe of the Black Templar Crusade. Write a brief historical record of our holy crusade.
Campaign Name: "${campaignName || "The Velvet Purge"}"
Crusader Champion: "${crusaderName || "Brother-Captain Sigismund"}"
Topic/Focus: "${topic || "The Purging of the Feral Horde"}"

Theme: Extreme gothic sci-fi, dark, zealous, Doom-like adrenaline mixed with medieval chivalry and religious dread. The enemy is the "Furry Corruption" (monstrous, twisted beast-demons wearing mocking animal hides).

Generate a highly immersive chronicle chapter in JSON format containing:
1. "title": A heavy gothic title (e.g., "The Massacre at Saint Sanguine").
2. "narrative": A powerful, atmospheric narrative of 150-200 words detailing the battle, the sounds of bolters, the roaring chainswords, and the screeching beasts (primarily in Thai, using high-class, dramatic language).
3. "englishLore": A short 2-3 sentence English lore summary.
4. "relicRecovered": A special holy relic uncovered from this battle (e.g., "The Skull of Saint Kaelen", "The Chalice of Wrath").

Respond ONLY with a valid JSON object matching this schema. Do not include markdown formatting or backticks around the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text.trim()));
  } catch (error: any) {
    console.error("Chronicle error:", error);
    res.status(500).json({
      error: "The scribe's ink dried. Chronicle could not be penned.",
      details: error.message,
    });
  }
});

// Setup Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite dev server middleware mode initiating...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Production static build serving mode initiating...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Templar's Wrath Server] Running on http://localhost:${PORT}`);
  });
}

setupServer();
