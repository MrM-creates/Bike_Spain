#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { parseTripData, serializeTripData } = require("../lib/trip-data");

const clone = (value) => JSON.parse(JSON.stringify(value));

const setCurrentPlanAsOriginal = (tripData) => ({
  ...tripData,
  originalPlanVersion: tripData.publishedVersion,
  baselineDays: clone(tripData.publishedDays),
  baselineAccommodations: clone(tripData.accommodations)
});

if (require.main === module) {
  const target = path.join(__dirname, "..", "data", "trip-spanien-2026.js");
  const tripData = parseTripData(fs.readFileSync(target, "utf8"));
  const updated = setCurrentPlanAsOriginal(tripData);
  fs.writeFileSync(target, serializeTripData(updated));
  process.stdout.write(`Originalplan auf Version ${updated.originalPlanVersion} gesetzt.\n`);
}

module.exports = { setCurrentPlanAsOriginal };
