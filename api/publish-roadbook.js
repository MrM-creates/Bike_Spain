const DEFAULT_REPO = "MrM-creates/Bike_Spain";
const DEFAULT_BRANCH = "main";
const ROADBOOK_PATH = "reise-roadbook-2026.html";

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
    if (payload.secret !== process.env.ROADBOOK_PUBLISH_SECRET) {
      json(response, 401, { error: "Publish-PIN ist falsch." });
      return;
    }

    if (!Array.isArray(payload.days) || payload.days.length < 1) {
      json(response, 400, { error: "Keine Roadbook-Tage erhalten." });
      return;
    }

    const days = payload.days.map(normalizeDay);
    const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
    const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
    const encodedPath = encodeURIComponent(ROADBOOK_PATH);
    const contentPath = `/repos/${repo}/contents/${encodedPath}`;
    const current = await githubRequest(`${contentPath}?ref=${encodeURIComponent(branch)}`);
    const html = Buffer.from(current.content, "base64").toString("utf8");
    const updatedHtml = bumpStorageKey(replaceCurrentDays(html, days));

    const message = payload.reason
      ? `Update roadbook plan: ${String(payload.reason).slice(0, 140)}`
      : "Update roadbook plan";

    const result = await githubRequest(contentPath, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: Buffer.from(updatedHtml, "utf8").toString("base64"),
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
      path: ROADBOOK_PATH
    });
  } catch (error) {
    json(response, error.status || 500, {
      error: error.message || "Publish fehlgeschlagen.",
      details: error.body || null
    });
  }
};
