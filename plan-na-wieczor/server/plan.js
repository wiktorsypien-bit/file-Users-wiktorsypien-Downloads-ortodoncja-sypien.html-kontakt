// Core logic for generating a date plan via the Anthropic API with web search.
// Kept free of Express so it can be unit-tested with a fake client.

export const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8000;
const MAX_PAUSE_CONTINUATIONS = 8;

const VIBES = {
  romantic: "romantyczny — nastrojowe, kameralne miejsca, ładne widoki, bliskość",
  adventure: "przygodowy — aktywności, adrenalina, nietypowe atrakcje, ruch",
  chill: "na luzie — spokojne, bezpretensjonalne miejsca, dobra rozmowa, zero spinania",
  culture: "kulturalny — sztuka, muzyka, teatr, architektura, ciekawe historie",
  food: "kulinarny — jedzenie jako główna atrakcja, lokalne smaki, degustacje",
};

const BUDGETS = {
  low: "niski — tani wieczór, maksymalnie ok. równowartość 25-40 EUR na parę łącznie",
  mid: "średni — ok. równowartość 60-120 EUR na parę łącznie",
  high: "wysoki — premium, równowartość 150+ EUR na parę, można szaleć",
};

export function buildSystemPrompt() {
  return `Jesteś ekspertem od planowania randek i lokalnym przewodnikiem. Twoim zadaniem jest ułożenie planu wieczornej randki w podanym mieście.

ZASADY:
1. UŻYJ narzędzia web_search, aby znaleźć PRAWDZIWE, AKTUALNIE DZIAŁAJĄCE miejsca w tym mieście (restauracje, atrakcje, wydarzenia). Zweryfikuj, że istnieją i są otwarte — nie wymyślaj lokali. Sprawdź orientacyjne godziny otwarcia i ceny.
2. Plan to 4-5 przystanków ułożonych chronologicznie na jeden wieczór (zwykle między ok. 17:00 a 23:30), w sensownej kolejności geograficznej.
3. Koszty podawaj w LOKALNEJ walucie danego kraju (np. PLN w Polsce, CAD w Kanadzie). Koszt liczony dla PARY (2 osoby).
4. Cały tekst widoczny dla użytkownika pisz PO POLSKU.

ODPOWIEDŹ KOŃCOWA: po zakończeniu wyszukiwania odpowiedz WYŁĄCZNIE jednym obiektem JSON (bez markdownu, bez \`\`\`, bez tekstu przed ani po), dokładnie w tym schemacie:
{
  "city": "nazwa miasta",
  "currency": "kod waluty, np. PLN",
  "title": "krótki, klimatyczny tytuł wieczoru po polsku",
  "summary": "1-2 zdania opisujące pomysł na wieczór",
  "stops": [
    {
      "time": "18:00",
      "name": "nazwa prawdziwego miejsca",
      "area": "dzielnica / ulica",
      "what": "co tam robicie (1-2 zdania)",
      "why": "dlaczego to działa na randce (1 zdanie)",
      "cost": "orientacyjny koszt dla pary, np. '120 PLN' albo '0 PLN'"
    }
  ],
  "total_cost": "orientacyjna suma dla pary, np. '300-380 PLN'"
}`;
}

export function buildUserPrompt({ city, vibe, budget, adultsOnly }) {
  const alcoholRule = adultsOnly
    ? `Tryb 18+ jest WŁĄCZONY: możesz uwzględnić bary, puby i koktajlbary, ale NAJPIERW sprawdź (web_search), jaki jest legalny wiek spożywania alkoholu w kraju, w którym leży to miasto. Lokale z alkoholem uwzględnij TYLKO jeśli ten wiek to dokładnie 18 lat. Jeśli jest wyższy (np. 19 w Kolumbii Brytyjskiej, 21 w USA), pomiń lokale nastawione na alkohol i wybierz alternatywy.`
    : `Tryb 18+ jest WYŁĄCZONY: nie uwzględniaj barów, pubów ani miejsc nastawionych głównie na alkohol.`;

  return `Zaplanuj wieczorną randkę.
Miasto: ${city}
Klimat: ${VIBES[vibe] ?? vibe}
Budżet: ${BUDGETS[budget] ?? budget}
${alcoholRule}

Znajdź prawdziwe miejsca przez web_search, a następnie zwróć wyłącznie obiekt JSON zgodny ze schematem.`;
}

// --- Robust JSON extraction -------------------------------------------------

export function validatePlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return false;
  if (typeof plan.city !== "string" || typeof plan.currency !== "string") return false;
  if (typeof plan.total_cost !== "string") return false;
  if (!Array.isArray(plan.stops) || plan.stops.length < 3 || plan.stops.length > 6) return false;
  return plan.stops.every(
    (s) =>
      s &&
      typeof s.time === "string" &&
      typeof s.name === "string" &&
      typeof s.what === "string",
  );
}

export function extractPlanJson(text) {
  if (!text) return null;
  const candidates = [];

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) candidates.push(fenced[1]);

  candidates.push(text);

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate.trim());
      if (validatePlan(parsed)) return parsed;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

function collectText(response) {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

// --- Conversation loop ------------------------------------------------------

async function createWithPauseHandling(client, baseParams, messages) {
  let response = await client.messages.create({ ...baseParams, messages });

  // Web search is a server-side tool: when its internal loop hits the
  // iteration limit, the API returns stop_reason "pause_turn". Append the
  // assistant content and re-send — the server resumes where it left off.
  let continuations = 0;
  while (response.stop_reason === "pause_turn") {
    if (++continuations > MAX_PAUSE_CONTINUATIONS) {
      throw new Error("Model nie zakończył odpowiedzi (zbyt wiele kontynuacji pause_turn).");
    }
    messages = [...messages, { role: "assistant", content: response.content }];
    response = await client.messages.create({ ...baseParams, messages });
  }

  if (response.stop_reason === "max_tokens") {
    throw new Error("Odpowiedź modelu została ucięta (max_tokens). Spróbuj ponownie.");
  }
  if (response.stop_reason === "refusal") {
    throw new Error("Model odmówił wykonania tego zapytania.");
  }
  return { response, messages };
}

/**
 * Generates a date plan. Accepts the Anthropic client as an argument so tests
 * can inject a fake. Performs one automatic repair retry when the model's
 * answer is not valid JSON.
 */
export async function generatePlan(client, params) {
  const baseParams = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(),
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
  };

  let messages = [{ role: "user", content: buildUserPrompt(params) }];
  let { response, messages: updated } = await createWithPauseHandling(
    client,
    baseParams,
    messages,
  );

  let plan = extractPlanJson(collectText(response));
  if (plan) return plan;

  // Automatic retry: ask the model to re-emit pure JSON in the same conversation.
  messages = [
    ...updated,
    { role: "assistant", content: response.content },
    {
      role: "user",
      content:
        "Twoja poprzednia odpowiedź nie była poprawnym JSON-em zgodnym ze schematem. " +
        "Odpowiedz TERAZ wyłącznie jednym poprawnym obiektem JSON — bez markdownu i bez żadnego innego tekstu.",
    },
  ];
  ({ response } = await createWithPauseHandling(client, baseParams, messages));

  plan = extractPlanJson(collectText(response));
  if (plan) return plan;

  throw new Error("Nie udało się uzyskać poprawnego planu od modelu (niepoprawny JSON).");
}
