import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Timeline from "../client/src/Timeline.jsx";
import { mockPlan } from "../server/mock.js";

describe("Timeline", () => {
  it.each(["Katowice", "Vancouver"])("renders the %s plan as a timeline", (city) => {
    const plan = mockPlan({ city });
    const html = renderToStaticMarkup(<Timeline plan={plan} />);

    expect(html).toContain(plan.title);
    expect(html).toContain(plan.total_cost);
    for (const stop of plan.stops) {
      expect(html).toContain(stop.name);
      expect(html).toContain(stop.time);
      expect(html).toContain(stop.cost);
    }
    // 4-5 stops rendered as list items on the timeline
    const items = html.match(/class="stop"/g) ?? [];
    expect(items.length).toBe(plan.stops.length);
    expect(plan.stops.length).toBeGreaterThanOrEqual(4);
  });
});
