const ASSIGNMENT_PREFIX = "window.__TRIP_DATA__ = Object.freeze(";
const ASSIGNMENT_SUFFIX = ");\n";

const parseTripData = (source) => {
  const start = source.indexOf(ASSIGNMENT_PREFIX);
  const end = source.lastIndexOf(ASSIGNMENT_SUFFIX);
  if (start < 0 || end < start) throw new Error("Kanonische Reisedaten konnten nicht gelesen werden.");
  return JSON.parse(source.slice(start + ASSIGNMENT_PREFIX.length, end));
};

const serializeTripData = (data) => `${ASSIGNMENT_PREFIX}${JSON.stringify(data, null, 2)}${ASSIGNMENT_SUFFIX}`;

const normalizePlanKind = (kind, fallback = "published") => {
  if (kind === "adjusted") return "adjusted";
  if (kind === "published" || kind === "original") return "published";
  return fallback === "adjusted" ? "adjusted" : "published";
};

module.exports = { parseTripData, serializeTripData, normalizePlanKind };
