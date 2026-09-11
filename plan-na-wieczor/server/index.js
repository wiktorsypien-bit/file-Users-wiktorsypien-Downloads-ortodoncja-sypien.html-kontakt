import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { generatePlan } from "./plan.js";
import { mockPlan } from "./mock.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const MOCK = process.env.MOCK === "1";

const app = express();
app.use(express.json());

let client = null;
if (!MOCK) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[plan-na-wieczor] UWAGA: brak ANTHROPIC_API_KEY w środowisku. " +
        "Zapytania do /api/plan będą zwracać błąd. (Tryb mock: MOCK=1 npm run dev)",
    );
  } else {
    // Web search can take 20-40s per round and pause_turn may add more rounds;
    // give each API call a generous 5-minute timeout.
    client = new Anthropic({ timeout: 5 * 60 * 1000, maxRetries: 2 });
  }
}

const VALID_VIBES = new Set(["romantic", "adventure", "chill", "culture", "food"]);
const VALID_BUDGETS = new Set(["low", "mid", "high"]);

app.post("/api/plan", async (req, res) => {
  const { city, vibe, budget, adultsOnly } = req.body ?? {};

  if (!city || typeof city !== "string" || !city.trim()) {
    return res.status(400).json({ error: "Podaj miasto." });
  }
  if (!VALID_VIBES.has(vibe)) {
    return res.status(400).json({ error: "Nieprawidłowy klimat wieczoru." });
  }
  if (!VALID_BUDGETS.has(budget)) {
    return res.status(400).json({ error: "Nieprawidłowy budżet." });
  }

  const params = {
    city: city.trim().slice(0, 80),
    vibe,
    budget,
    adultsOnly: Boolean(adultsOnly),
  };

  try {
    if (MOCK) {
      await new Promise((r) => setTimeout(r, 1500)); // simulate search latency
      return res.json({ plan: mockPlan(params) });
    }
    if (!client) {
      return res.status(500).json({
        error:
          "Serwer nie ma skonfigurowanego klucza API (ANTHROPIC_API_KEY). " +
          "Ustaw zmienną środowiskową i zrestartuj serwer.",
      });
    }
    const plan = await generatePlan(client, params);
    return res.json({ plan });
  } catch (err) {
    console.error("[/api/plan] error:", err);
    const message =
      err instanceof Anthropic.APIError
        ? `Błąd API Anthropic (${err.status ?? "?"}): ${err.message}`
        : err?.message || "Nieznany błąd serwera.";
    return res.status(502).json({ error: message });
  }
});

// In production, serve the built frontend (npm run build → client/dist).
if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(
    `[plan-na-wieczor] API nasłuchuje na http://localhost:${PORT}` +
      (MOCK ? " (TRYB MOCK — bez prawdziwych zapytań do Anthropic)" : ""),
  );
});
