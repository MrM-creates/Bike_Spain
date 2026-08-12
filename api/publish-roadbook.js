const DEFAULT_REPO = "MrM-creates/Bike_Spain";
const DEFAULT_BRANCH = "main";
const ROADBOOK_PATH = "reise-roadbook-2026.html";
const ACCOMMODATIONS_PATH = "unterkuenfte-2026.html";

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
    "status", "custom", "mainLabel", "mainMeta", "alt"
  ];
  const output = {};
  allowed.forEach((key) => {
    if (day[key] !== undefined && day[key] !== null && day[key] !== "") output[key] = day[key];
  });
  if (!Array.isArray(output.waypoints)) output.waypoints = [];
  if (output.alt && !Array.isArray(output.alt)) delete output.alt;
  if (output.status && !["planned", "changed", "done", "skipped"].includes(output.status)) output.status = "changed";
  return output;
};

const normalizeAccommodationEntry = (entry) => {
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

const normalizeAccommodationState = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Unterkunftsdaten muessen ein Objekt sein.");
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [String(key).trim(), normalizeAccommodationEntry(value)])
      .filter(([key, value]) => key && Object.keys(value).length)
  );
};

const findArrayEnd = (source, startIndex) => {
  let depth = 0;
  let quote = "";
  let escape = false;
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escape) escape = false;
      else if (char === "\\") escape = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("currentDays konnte nicht vollständig gelesen werden.");
};

const replaceCurrentDays = (html, days) => {
  const marker = "const currentDays = ";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("const currentDays wurde nicht gefunden.");
  const arrayStart = html.indexOf("[", start);
  if (arrayStart < 0) throw new Error("currentDays Array wurde nicht gefunden.");
  const arrayEnd = findArrayEnd(html, arrayStart);
  const serialized = JSON.stringify(days, null, 6).replace(/\n/g, "\n    ");
  return `${html.slice(0, start)}const currentDays = ${serialized};${html.slice(arrayEnd + 2)}`;
};

const bumpStorageKey = (html) => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 12);
  return html.replace(
    /const STORAGE_KEY = "spanien-roadbook-2026-plan-[^"]+";/,
    `const STORAGE_KEY = "spanien-roadbook-2026-plan-${stamp}";`
  );
};

const publishedVersion = (html) => html.match(/const PUBLISHED_VERSION = "([^"]+)";/)?.[1] || "legacy";

const bumpPublishedVersion = (html, version) => {
  const statement = `const PUBLISHED_VERSION = "${version}";`;
  if (/const PUBLISHED_VERSION = "[^"]+";/.test(html)) {
    return html.replace(/const PUBLISHED_VERSION = "[^"]+";/, statement);
  }
  return html.replace(/(const STORAGE_KEY = "[^"]+";)/, `${statement}\n    $1`);
};

const replacePublishedAccommodationState = (html, state) => {
  const marker = "const publishedAccommodationState = ";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("publishedAccommodationState wurde nicht gefunden.");
  const statementEnd = html.indexOf(";\n", start);
  if (statementEnd < 0) throw new Error("publishedAccommodationState konnte nicht vollstaendig gelesen werden.");
  const serialized = JSON.stringify(state, null, 6).replace(/\n/g, "\n    ");
  return `${html.slice(0, start)}const publishedAccommodationState = ${serialized};${html.slice(statementEnd + 1)}`;
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
    const [currentRoadbook, currentAccommodations] = await Promise.all([
      githubRequest(`/repos/${repo}/contents/${encodeURIComponent(ROADBOOK_PATH)}?ref=${encodeURIComponent(branch)}`),
      accommodations ? githubRequest(`/repos/${repo}/contents/${encodeURIComponent(ACCOMMODATIONS_PATH)}?ref=${encodeURIComponent(branch)}`) : null
    ]);
    const roadbookHtml = Buffer.from(currentRoadbook.content, "base64").toString("utf8");
    const currentVersion = publishedVersion(roadbookHtml);
    if (payload.baseVersion && String(payload.baseVersion) !== currentVersion) {
      json(response, 409, { error: "Der Online-Plan wurde inzwischen geändert. Lade den aktuellen Stand und erstelle den Entwurf erneut." });
      return;
    }
    const nextVersion = new Date().toISOString();
    const updatedRoadbookHtml = bumpPublishedVersion(bumpStorageKey(replaceCurrentDays(roadbookHtml, days)), nextVersion);

    const message = payload.reason
      ? `Update roadbook plan: ${String(payload.reason).slice(0, 140)}`
      : "Update roadbook plan";

    const files = [{ path: ROADBOOK_PATH, content: updatedRoadbookHtml }];
    if (accommodations) {
      const accommodationHtml = Buffer.from(currentAccommodations.content, "base64").toString("utf8");
      files.push({ path: ACCOMMODATIONS_PATH, content: replacePublishedAccommodationState(accommodationHtml, accommodations) });
    }
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
