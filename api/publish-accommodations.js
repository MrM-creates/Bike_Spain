const DEFAULT_REPO = "MrM-creates/Bike_Spain";
const DEFAULT_BRANCH = "main";
const TRIP_DATA_PATH = "data/trip-spanien-2026.js";
const { parseTripData, serializeTripData } = require("../lib/trip-data");

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

const normalizeEntry = (entry) => {
  const allowed = ["booking", "date", "nights", "startDate", "endDate", "nightCount", "title", "baseNote", "firstChoice", "firstChoiceUrl", "alternative", "alternativeUrl", "note", "hideBaseline", "inactive"];
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

const normalizeState = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Unterkunftsdaten muessen ein Objekt sein.");
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [String(key).trim(), normalizeEntry(value)])
      .filter(([key, value]) => key && Object.keys(value).length)
  );
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

    const state = normalizeState(payload.accommodations);
    const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
    const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
    const encodedPath = encodeURIComponent(TRIP_DATA_PATH);
    const contentPath = `/repos/${repo}/contents/${encodedPath}`;
    const current = await githubRequest(`${contentPath}?ref=${encodeURIComponent(branch)}`);
    const tripData = parseTripData(Buffer.from(current.content, "base64").toString("utf8"));
    if (!tripData.baselineAccommodations) tripData.baselineAccommodations = tripData.accommodations;
    tripData.accommodations = state;
    tripData.publishedVersion = new Date().toISOString();
    const updatedContent = serializeTripData(tripData);

    const message = payload.reason
      ? `Update accommodations: ${String(payload.reason).slice(0, 140)}`
      : "Update accommodations";

    const result = await githubRequest(contentPath, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: Buffer.from(updatedContent, "utf8").toString("base64"),
        sha: current.sha,
        branch
      })
    });

    json(response, 200, {
      ok: true,
      commit: result.commit?.sha || null,
      message,
      branch,
      repo,
      path: TRIP_DATA_PATH,
      version: tripData.publishedVersion
    });
  } catch (error) {
    json(response, error.status || 500, {
      error: error.message || "Publish fehlgeschlagen.",
      details: error.body || null
    });
  }
};
