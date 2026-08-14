const assert = require("node:assert/strict");
const { routeContinuityIssue } = require("../api/create-plan-draft")._test;

const days = [
  { overnight: "Castelldefels" },
  {
    rest: false,
    origin: "La Patacona, Spain",
    destination: "Lleida, Spain",
    overnight: "Lleida (Stadtrand)"
  },
  {
    rest: false,
    origin: "Lleida, Spain",
    destination: "La Seu d Urgell, Spain",
    overnight: "La Seu d Urgell (Ortsrand)"
  }
];

assert.match(routeContinuityIssue(days, 1, 3), /Tag 2 beginnt in La Patacona/);

days[1].origin = "Castelldefels, Spain";
assert.equal(routeContinuityIssue(days, 1, 3), "");

days[2].destination = "Vielha, Spain";
assert.match(routeContinuityIssue(days, 1, 3), /Übernachtung ist aber/);

days[2] = { rest: true, origin: "", destination: "", overnight: "Lleida (Stadtrand)" };
assert.equal(routeContinuityIssue(days, 1, 3), "");

days[2].overnight = "Pamplona";
assert.match(routeContinuityIssue(days, 1, 3), /beginnt in Pamplona/);

console.log("create-plan-draft tests passed");
