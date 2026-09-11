import { describe, it, expect } from "vitest";
import { extractPlanJson, validatePlan, generatePlan, buildUserPrompt } from "../server/plan.js";
import { mockPlan } from "../server/mock.js";

const VALID_PLAN = mockPlan({ city: "Katowice" });
const VALID_JSON = JSON.stringify(VALID_PLAN);

// A fake Anthropic client returning scripted responses in order.
function fakeClient(responses) {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (params) => {
        calls.push(params);
        const next = responses.shift();
        if (!next) throw new Error("fake client: no more scripted responses");
        return next;
      },
    },
  };
}

const textResponse = (text, stop_reason = "end_turn") => ({
  stop_reason,
  content: [{ type: "text", text }],
});

describe("extractPlanJson", () => {
  it("parses a bare JSON object", () => {
    expect(extractPlanJson(VALID_JSON)).toEqual(VALID_PLAN);
  });

  it("parses JSON inside a markdown fence", () => {
    expect(extractPlanJson("Oto plan:\n```json\n" + VALID_JSON + "\n```\nMiłego!")).toEqual(
      VALID_PLAN,
    );
  });

  it("parses JSON surrounded by prose", () => {
    expect(extractPlanJson("Świetnie, oto Twój plan! " + VALID_JSON + " Udanej randki!")).toEqual(
      VALID_PLAN,
    );
  });

  it("returns null for garbage", () => {
    expect(extractPlanJson("nie mam planu, przepraszam")).toBeNull();
  });

  it("returns null for JSON with the wrong shape", () => {
    expect(extractPlanJson(JSON.stringify({ city: "X", stops: [] }))).toBeNull();
  });
});

describe("validatePlan", () => {
  it("accepts both mock plans (Katowice, Vancouver)", () => {
    expect(validatePlan(mockPlan({ city: "Katowice" }))).toBe(true);
    expect(validatePlan(mockPlan({ city: "Vancouver" }))).toBe(true);
  });

  it("rejects a plan with too few stops", () => {
    expect(validatePlan({ ...VALID_PLAN, stops: VALID_PLAN.stops.slice(0, 2) })).toBe(false);
  });
});

describe("generatePlan — pause_turn handling", () => {
  it("continues the conversation until the final answer", async () => {
    const searchContent = [
      { type: "server_tool_use", id: "srvtoolu_1", name: "web_search", input: { query: "x" } },
    ];
    const client = fakeClient([
      { stop_reason: "pause_turn", content: searchContent },
      { stop_reason: "pause_turn", content: searchContent },
      textResponse(VALID_JSON),
    ]);

    const plan = await generatePlan(client, {
      city: "Katowice",
      vibe: "romantic",
      budget: "mid",
      adultsOnly: false,
    });

    expect(plan).toEqual(VALID_PLAN);
    expect(client.calls).toHaveLength(3);
    // Each continuation must re-send history with the assistant content appended.
    expect(client.calls[1].messages).toHaveLength(2);
    expect(client.calls[1].messages[1]).toEqual({ role: "assistant", content: searchContent });
    expect(client.calls[2].messages).toHaveLength(3);
    // The web_search tool must be declared on every request.
    for (const call of client.calls) {
      expect(call.tools?.[0]?.type).toBe("web_search_20260209");
    }
  });

  it("gives up after too many pause_turn continuations", async () => {
    const pauses = Array.from({ length: 20 }, () => ({
      stop_reason: "pause_turn",
      content: [{ type: "text", text: "..." }],
    }));
    const client = fakeClient(pauses);
    await expect(
      generatePlan(client, { city: "X", vibe: "chill", budget: "low", adultsOnly: false }),
    ).rejects.toThrow(/pause_turn/);
  });
});

describe("generatePlan — JSON repair retry", () => {
  it("retries once when the first answer is not valid JSON", async () => {
    const client = fakeClient([
      textResponse("Niestety nie mogę sformatować tego jako JSON, ale oto plan opisowo..."),
      textResponse(VALID_JSON),
    ]);

    const plan = await generatePlan(client, {
      city: "Katowice",
      vibe: "food",
      budget: "high",
      adultsOnly: true,
    });

    expect(plan).toEqual(VALID_PLAN);
    expect(client.calls).toHaveLength(2);
    // The retry appends the bad assistant turn + a repair instruction.
    const retryMessages = client.calls[1].messages;
    expect(retryMessages.at(-1).role).toBe("user");
    expect(retryMessages.at(-1).content).toMatch(/JSON/);
    expect(retryMessages.at(-2).role).toBe("assistant");
  });

  it("throws a clear error when the retry also fails", async () => {
    const client = fakeClient([textResponse("blabla"), textResponse("dalej nie JSON")]);
    await expect(
      generatePlan(client, { city: "X", vibe: "chill", budget: "low", adultsOnly: false }),
    ).rejects.toThrow(/niepoprawny JSON/);
    expect(client.calls).toHaveLength(2);
  });

  it("surfaces max_tokens truncation as an error", async () => {
    const client = fakeClient([textResponse("{", "max_tokens")]);
    await expect(
      generatePlan(client, { city: "X", vibe: "chill", budget: "low", adultsOnly: false }),
    ).rejects.toThrow(/max_tokens/);
  });
});

describe("buildUserPrompt — 18+ rule", () => {
  it("mentions the legal drinking age check only when adultsOnly is on", () => {
    const on = buildUserPrompt({ city: "Vancouver", vibe: "chill", budget: "mid", adultsOnly: true });
    const off = buildUserPrompt({ city: "Vancouver", vibe: "chill", budget: "mid", adultsOnly: false });
    expect(on).toMatch(/legalny wiek/);
    expect(on).toMatch(/dokładnie 18 lat/);
    expect(off).toMatch(/WYŁĄCZONY/);
    expect(off).not.toMatch(/dokładnie 18 lat/);
  });
});
