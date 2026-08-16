const DEFAULT_REPO = "MrM-creates/Bike_Spain";
const DEFAULT_BRANCH = "main";
const TRIP_DATA_PATH = "data/trip-spanien-2026.js";
const { parseTripData, serializeTripData, normalizePlanKind } = require("../lib/trip-data");

const json = (response, status, body) => {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
};

const githubRequest = async (path, options = {}) => {
  const token = process.env.GITHUB_ROADBOOK_TOKEN;
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "motorrad-roadbook-publisher",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = body?.message || `GitHub API error ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
};

const normalizeDay = (day) => {
  if (!day || typeof day !== "object") throw new Error("Jeder Tag muss ein Objekt sein.");
  if (!day.title || typeof day.title !== "string") throw new Error("Jeder Tag braucht einen Titel.");

  const allowed = [
    "id", "day", "title", "type", "overnight", "km", "time", "roads", "points",
    "note", "travelNote", "alert", "rest", "origin", "destination", "waypoints",
    "status", "custom", "mainLabel", "mainMeta", "alt", "routeStyle"
  ];
  const output = {};
  allowed.forEach((key) => {
    if (day[key] !== undefined && day[key] !== null && day[key] !== "") output[key] = day[key];
  });
  if (!Array.isArray(output.waypoints)) output.waypoints = [];
  if (output.alt && !Array.isArray(output.alt)) delete output.alt;
  if (output.status && !["planned", "changed", "done", "skipped"].includes(output.status)) output.status = "changed";
  if (output.routeStyle && !["direct", "scenic"].includes(output.routeStyle)) delete output.routeStyle;
  return output;
};

const normalizeAccommodationEntry = (entry) => {
  const allowed = ["booking", "date", "nights", "startDate", "endDate", "nightCount", "title", "baseNote", "firstChoice", "firstChoiceUrl", "alternative", "alternativeUrl", "note", "hideBaseline", "inactive", "order"];
  const output = {};
  allowed.forEach((key) => {
    if (entry?.[key] !== undefined && entry[key] !== null) {
      const value = String(entry[key]).trim();
      if (value) output[key] = value;
    }
  });
  if (output.booking && !["asked", "booked"].includes(output.booking)) delete output.booking;
  return output;
};

const normalizeAccommodationState = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Unterkunftsdaten muessen ein Objekt sein.");
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [String(key).trim(), normalizeAccommodationEntry(value)])
      .filter(([key, value]) => key && Object.keys(value).length)
  );
};

const createCommit = async ({ repo, branch, message, files }) => {
  const refPath = `/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`;
  const ref = await githubRequest(refPath);
  const headSha = ref.object.sha;
  const headCommit = await githubRequest(`/repos/${repo}/git/commits/${headSha}`);
  const treeItems = [];
  for (const file of files) {
    const blob = await githubRequest(`/repos/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: file.content, encoding: "utf-8" })
    });
    treeItems.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const tree = await githubRequest(`/repos/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: treeItems })
  });
  const commit = await githubRequest(`/repos/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] })
  });
  await githubRequest(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false })
  });
  return commit;
};

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    json(response, 405, { error: "Nur POST ist erlaubt." });
    return;
  }

  try {
    if (!process.env.GITHUB_ROADBOOK_TOKEN || !process.env.ROADBOOK_PUBLISH_SECRET) {
      json(response, 500, { error: "Publish-Secrets fehlen auf Vercel." });
      return;
    }

    const payload = await readBody(request);
    const submittedSecret = String(payload.secret || "").trim();
    const configuredSecret = String(process.env.ROADBOOK_PUBLISH_SECRET || "").trim();
    if (submittedSecret !== configuredSecret) {
      json(response, 401, { error: "Publish-PIN ist falsch." });
      return;
    }

    if (!Array.isArray(payload.days) || payload.days.length < 1) {
      json(response, 400, { error: "Keine Roadbook-Tage erhalten." });
      return;
    }

    const days = payload.days.map(normalizeDay);
    const accommodations = payload.accommodations ? normalizeAccommodationState(payload.accommodations) : null;
    const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
    const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
    const current = await githubRequest(`/repos/${repo}/contents/${encodeURIComponent(TRIP_DATA_PATH)}?ref=${encodeURIComponent(branch)}`);
    const tripData = parseTripData(Buffer.from(current.content, "base64").toString("utf8"));
    const currentVersion = tripData.publishedVersion || "legacy";
    const planKind = normalizePlanKind(payload.planKind, tripData.planKind);
    if (payload.baseVersion && String(payload.baseVersion) !== currentVersion) {
      json(response, 409, { error: "Der Online-Plan wurde inzwischen geändert. Lade den aktuellen Stand und erstelle den Entwurf erneut." });
      return;
    }
    const nextVersion = new Date().toISOString();
    tripData.publishedDays = days;
    if (accommodations) {
      if (!tripData.baselineAccommodations) tripData.baselineAccommodations = tripData.accommodations;
      tripData.accommodations = accommodations;
    }
    tripData.publishedVersion = nextVersion;
    tripData.planKind = planKind;

    const message = payload.reason
      ? `Update roadbook plan: ${String(payload.reason).slice(0, 140)}`
      : "Update roadbook plan";

    const files = [{ path: TRIP_DATA_PATH, content: serializeTripData(tripData) }];
    const result = await createCommit({ repo, branch, message, files });

    json(response, 200, {
      ok: true,
      commit: result.sha || null,
      message,
      branch,
      repo,
      paths: files.map((file) => file.path),
      version: nextVersion
    });
  } catch (error) {
    json(response, error.status || 500, {
      error: error.message || "Publish fehlgeschlagen.",
      details: error.body || null
    });
  }
};
