const test = require("node:test");
const assert = require("node:assert/strict");
const { setCurrentPlanAsOriginal } = require("../scripts/set-current-plan-as-original");

test("setting the original plan creates an independent fallback snapshot", () => {
  const source = {
    publishedVersion: "v-current",
    publishedDays: [{ day: 1, title: "Current route" }],
    accommodations: { first: { title: "Current hotel" } }
  };
  const result = setCurrentPlanAsOriginal(source);

  source.publishedDays[0].title = "Changed later";
  source.accommodations.first.title = "Changed later";

  assert.equal(result.originalPlanVersion, "v-current");
  assert.equal(result.baselineDays[0].title, "Current route");
  assert.equal(result.baselineAccommodations.first.title, "Current hotel");
});
