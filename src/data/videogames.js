const DEFAULT_JSON_URL = "/data/videogames.json";
const RAWG_BASE = "https://api.rawg.io/api";
const META_CACHE_KEY = "videogames-rawg-meta-v1";
const META_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const ACCOUNT_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const RAWG_PAGE_SIZE = 40;
const RAWG_MAX_PAGES = 80;

export const VIDEOGAMES_JSON_URL =
  import.meta.env.VITE_VIDEOGAMES_JSON_URL || DEFAULT_JSON_URL;

export const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || "";
export const RAWG_USERNAME = String(
  import.meta.env.VITE_RAWG_USERNAME || ""
).trim();

const ACCOUNT_CACHE_KEY = `videogames-rawg-account-v1:${RAWG_USERNAME || "none"}`;

const STATUS_ALIASES = {
  beaten: "beaten",
  complete: "complete",
  completed: "complete",
  playing: "playing",
  played: "played",
  unplayed: "unplayed",
  toplay: "toplay",
  "to-play": "toplay",
  beated: "beaten",
  dropped: "dropped",
  yet: "unplayed",
  pass: "pass",
};

export function statusLabel(status) {
  switch (status) {
    case "playing":
      return "Playing";
    case "played":
      return "Played";
    case "complete":
      return "Complete";
    case "beaten":
      return "Beaten";
    case "unplayed":
      return "Unplayed";
    case "toplay":
      return "To play";
    case "dropped":
      return "Dropped";
    case "pass":
      return "Pass";
    default:
      return status ? String(status) : "";
  }
}

export function stripHtml(value) {
  if (!value) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = String(value);
  return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
}

export function shortenText(text, max = 220) {
  if (!text || text.length <= max) return text || "";
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 140 ? lastSpace : max)}…`;
}

function normalizeStatus(item) {
  const raw = item.status ?? item.mainStory ?? "";
  const key = String(raw).trim().toLowerCase();
  if (!key) return "";
  return Object.hasOwn(STATUS_ALIASES, key) ? STATUS_ALIASES[key] : key;
}

function notesFromItem(item) {
  if (item.notes) return String(item.notes).trim();
  if (item.fullGame) return String(item.fullGame).replace(/`/g, "").trim();
  return "";
}

export function normalizeListItem(item, index) {
  const title = String(item.Title ?? item.title ?? "").trim();
  const slug = item.slug ?? item.Slug ?? item.rawgSlug ?? item.rawg_slug ?? "";
  const rawgId = item.rawgId ?? item.rawg_id ?? null;
  const poster =
    item.Poster ??
    item.poster ??
    item.cover ??
    item.image ??
    item["videogame-cover"] ??
    "";
  const plot =
    item.Plot ??
    item.plot ??
    item.description ??
    item["videogame-desc"] ??
    "";
  const genre = item.Genre ?? item.genre ?? item["videogame-meta"] ?? "";
  const year = item.Year ?? item.year ?? item.releasedYear ?? "";
  return {
    listIndex: index,
    title,
    slug: slug ? String(slug) : "",
    rawgId: rawgId != null && rawgId !== "" ? String(rawgId) : "",
    skipRawg: parseSkipRawg(item),
    preferJson: parsePreferJson(item),
    status: normalizeStatus(item),
    notes: notesFromItem(item),
    format: item.format ? String(item.format) : "",
    score: parsePersonalScore(item.score),
    own: item.own === "y" || item.own === true,
    poster: poster && poster !== "N/A" ? String(poster) : "",
    yearHint: year ? String(year).slice(0, 4) : "",
    plot: plot && plot !== "N/A" ? String(plot) : "",
    genreHint: genre && genre !== "N/A" ? String(genre) : "",
    platformHint: platformsFromItem(item),
  };
}

export function isUsableListItem(item) {
  return Boolean(item.slug || item.rawgId || item.title);
}

function parsePersonalScore(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseSkipRawg(item) {
  if (item.skipRawg === true || item.rawg === false) return true;
  const mode = String(item.rawg ?? "").trim().toLowerCase();
  return mode === "off" || mode === "json" || mode === "none";
}

function parsePreferJson(item) {
  if (item.preferJson === true) return true;
  const mode = String(item.rawg ?? "").trim().toLowerCase();
  return mode === "prefer-json" || mode === "preferjson";
}

function platformsFromItem(item) {
  if (Array.isArray(item.platforms)) {
    return item.platforms.map((p) => String(p).trim()).filter(Boolean);
  }
  const raw = item.Platform ?? item.platform ?? "";
  if (!raw || raw === "N/A") return [];
  return String(raw)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function pickMeta(jsonValue, rawgValue, preferJson) {
  if (preferJson) return jsonValue || rawgValue || "";
  return rawgValue || jsonValue || "";
}

function yearFromDate(released) {
  if (!released) return "";
  return String(released).slice(0, 4);
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalTitle(value) {
  return normalizeTitle(String(value || "").replace(/\(\s*\d{4}\s*\)/g, " "));
}

function pickSearchResult(results, title, yearHint) {
  if (!results?.length) return null;
  const needle = canonicalTitle(title);
  const scored = results.map((game) => {
    const name = canonicalTitle(game.name);
    let score = 0;
    if (name === needle) score += 10;
    else if (name.startsWith(`${needle} `) || needle.startsWith(`${name} `)) score += 4;
    else if (name.includes(needle) || needle.includes(name)) score += 2;

    const extraTokens = name
      .split(" ")
      .filter((token) => token && !needle.split(" ").includes(token));
    score -= Math.min(8, extraTokens.length * 2);

    const year = yearFromDate(game.released);
    if (yearHint && year === yearHint) score += 8;

    const ratings = Number(game.ratings_count) || 0;
    score += Math.min(8, Math.log10(ratings + 1) * 2.2);
    if (game.background_image) score += 1;
    if (typeof game.metacritic === "number") score += 1;
    return { game, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].game;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

function withRawgKey(url, key) {
  if (!url) return "";
  try {
    const next = new URL(url, RAWG_BASE);
    if (!next.searchParams.get("key")) {
      next.searchParams.set("key", key);
    }
    return next.toString();
  } catch {
    return url;
  }
}

async function fetchAllUserGames(username, key) {
  const collected = [];
  const seenIds = new Set();
  const params = new URLSearchParams({
    key,
    page: "1",
    page_size: String(RAWG_PAGE_SIZE),
  });
  let url = `${RAWG_BASE}/users/${encodeURIComponent(username)}/games?${params}`;

  for (let page = 0; url && page < RAWG_MAX_PAGES; page += 1) {
    const data = await fetchJson(url);
    for (const game of data.results || []) {
      if (game?.id != null) {
        const id = String(game.id);
        if (seenIds.has(id)) continue;
        seenIds.add(id);
      }
      collected.push(game);
    }
    url = withRawgKey(data.next || "", key);
  }

  return collected;
}

function normalizeUserGame(game, index) {
  const userStatus = game.user_game?.status ?? "";
  return {
    ...normalizeListItem(
      {
        Title: game.name,
        slug: game.slug,
        rawgId: game.id,
        Year: yearFromDate(game.released),
        Poster: game.background_image,
        Genre: (game.genres || [])
          .map((g) => g.name)
          .filter(Boolean)
          .join(", "),
        mainStory: userStatus,
      },
      index
    ),
    rawgPreview: game,
  };
}

function titleYearKey(title, yearHint) {
  const name = String(title || "").trim().toLowerCase();
  const year = String(yearHint || "").slice(0, 4);
  if (!name || !/^\d{4}$/.test(year)) return "";
  return `${name}|${year}`;
}

function rememberItem(maps, item, index) {
  if (item.rawgId) maps.byId.set(item.rawgId, index);
  if (item.slug) maps.bySlug.set(item.slug.toLowerCase(), index);
  const ty = titleYearKey(item.title, item.yearHint);
  if (ty) maps.byTitleYear.set(ty, index);
  const name = canonicalTitle(item.title);
  if (name && !maps.byTitle.has(name)) maps.byTitle.set(name, index);
}

function findMergedIndex(maps, item) {
  if (item.rawgId && maps.byId.has(item.rawgId)) {
    return maps.byId.get(item.rawgId);
  }
  if (item.slug && maps.bySlug.has(item.slug.toLowerCase())) {
    return maps.bySlug.get(item.slug.toLowerCase());
  }
  const ty = titleYearKey(item.title, item.yearHint);
  if (ty && maps.byTitleYear.has(ty)) {
    return maps.byTitleYear.get(ty);
  }
  const name = canonicalTitle(item.title);
  if (name && maps.byTitle.has(name)) {
    return maps.byTitle.get(name);
  }
  return -1;
}

function keepCdnPersonal(cdn, account) {
  return {
    ...cdn,
    title: cdn.title || account.title,
    slug: cdn.slug || account.slug,
    rawgId: cdn.rawgId || account.rawgId,
    yearHint: cdn.yearHint || account.yearHint,
    poster: cdn.poster || account.poster,
    plot: cdn.plot || account.plot,
    genreHint: cdn.genreHint || account.genreHint,
    platformHint: cdn.platformHint?.length ? cdn.platformHint : account.platformHint,
    skipRawg: cdn.skipRawg || account.skipRawg,
    preferJson: cdn.preferJson || account.preferJson,
    status: cdn.status,
    notes: cdn.notes,
    format: cdn.format,
    score: cdn.score,
    own: cdn.own,
  };
}

export function mergeLibraryItems(cdnItems, accountItems) {
  const out = [];
  const maps = {
    byId: new Map(),
    bySlug: new Map(),
    byTitleYear: new Map(),
    byTitle: new Map(),
  };

  for (const item of cdnItems) {
    rememberItem(maps, item, out.length);
    out.push(item);
  }

  for (const item of accountItems) {
    const match = findMergedIndex(maps, item);
    if (match >= 0) {
      const merged = keepCdnPersonal(out[match], item);
      out[match] = merged;
      rememberItem(maps, merged, match);
      continue;
    }
    rememberItem(maps, item, out.length);
    out.push(item);
  }

  return out;
}

async function fetchRawgDetails(idOrSlug, key) {
  const url = `${RAWG_BASE}/games/${encodeURIComponent(idOrSlug)}?key=${encodeURIComponent(key)}`;
  return fetchJson(url);
}

async function searchRawg(title, key) {
  const params = new URLSearchParams({
    key,
    search: title,
    page_size: "5",
  });
  const data = await fetchJson(`${RAWG_BASE}/games?${params}`);
  return data.results || [];
}

async function mapPool(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

function slimRawg(rawg) {
  if (!rawg) return null;
  return {
    id: rawg.id ?? null,
    slug: rawg.slug || "",
    name: rawg.name || "",
    background_image: rawg.background_image || "",
    released: rawg.released || "",
    description_raw: rawg.description_raw || "",
    description: rawg.description_raw ? "" : rawg.description || "",
    genres: (rawg.genres || []).map((g) => ({ name: g.name })).filter((g) => g.name),
    parent_platforms: (rawg.parent_platforms || []).map((p) => ({
      platform: { name: p.platform?.name || "" },
    })),
    metacritic: typeof rawg.metacritic === "number" ? rawg.metacritic : null,
    ratings_count: Number(rawg.ratings_count) || 0,
  };
}

function hasRawgDescription(rawg) {
  return Boolean(rawg?.description_raw || rawg?.description);
}

function emptyMetaCache() {
  return { records: {}, byId: {}, bySlug: {}, byTitle: {} };
}

function readMetaCache() {
  try {
    const raw = localStorage.getItem(META_CACHE_KEY);
    if (!raw) return emptyMetaCache();
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const cache = emptyMetaCache();
    for (const [key, entry] of Object.entries(parsed.records || {})) {
      if (!entry?.savedAt || now - entry.savedAt > META_TTL_MS || !entry.rawg) {
        continue;
      }
      cache.records[key] = entry;
    }
    cache.byId = parsed.byId || {};
    cache.bySlug = parsed.bySlug || {};
    cache.byTitle = parsed.byTitle || {};
    return cache;
  } catch {
    return emptyMetaCache();
  }
}

function persistJson(key, value) {
  const payload = JSON.stringify(value);
  try {
    localStorage.setItem(key, payload);
    return true;
  } catch {
    return false;
  }
}

function writeMetaCache(cache) {
  const payload = {
    records: cache.records,
    byId: cache.byId,
    bySlug: cache.bySlug,
    byTitle: cache.byTitle,
  };
  if (persistJson(META_CACHE_KEY, payload)) return;
  const entries = Object.entries(cache.records).sort(
    (a, b) => (a[1].savedAt || 0) - (b[1].savedAt || 0)
  );
  const drop = Math.ceil(entries.length / 2);
  for (let i = 0; i < drop; i += 1) {
    delete cache.records[entries[i][0]];
  }
  persistJson(META_CACHE_KEY, {
    records: cache.records,
    byId: cache.byId,
    bySlug: cache.bySlug,
    byTitle: cache.byTitle,
  });
}

function metaRecordKey(rawg, item) {
  if (rawg?.id != null) return `id:${rawg.id}`;
  if (item?.rawgId) return `id:${item.rawgId}`;
  const slug = String(rawg?.slug || item?.slug || "").toLowerCase();
  if (slug) return `slug:${slug}`;
  return `title:${canonicalTitle(rawg?.name || item?.title || "")}`;
}

function lookupCachedRawg(cache, item) {
  const keys = [];
  if (item.rawgId) keys.push(cache.byId[item.rawgId]);
  if (item.slug) keys.push(cache.bySlug[item.slug.toLowerCase()]);
  const titleKey = canonicalTitle(item.title);
  if (titleKey) keys.push(cache.byTitle[titleKey]);
  for (const key of keys) {
    const entry = key ? cache.records[key] : null;
    if (entry?.rawg) return entry.rawg;
  }
  return null;
}

function rememberRawg(cache, item, rawg) {
  const slim = slimRawg(rawg);
  if (!slim) return;
  const key = metaRecordKey(slim, item);
  cache.records[key] = { savedAt: Date.now(), rawg: slim };
  if (slim.id != null) cache.byId[String(slim.id)] = key;
  if (item.rawgId) cache.byId[String(item.rawgId)] = key;
  if (slim.slug) cache.bySlug[slim.slug.toLowerCase()] = key;
  if (item.slug) cache.bySlug[item.slug.toLowerCase()] = key;
  const titles = [canonicalTitle(slim.name), canonicalTitle(item.title)].filter(
    Boolean
  );
  for (const title of titles) {
    cache.byTitle[title] = key;
  }
}

function readAccountCache() {
  if (!RAWG_USERNAME) return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > ACCOUNT_TTL_MS) {
      return null;
    }
    return Array.isArray(parsed.games) ? parsed.games : null;
  } catch {
    return null;
  }
}

function writeAccountCache(games) {
  persistJson(ACCOUNT_CACHE_KEY, { savedAt: Date.now(), games });
}

async function resolveRawg(item, cache) {
  const cached = lookupCachedRawg(cache, item);
  if (cached && (hasRawgDescription(cached) || cached.background_image)) {
    if (!hasRawgDescription(cached) && (item.rawgId || item.slug || cached.slug || cached.id)) {
      try {
        const detailed = await fetchRawgDetails(
          item.rawgId || item.slug || cached.slug || cached.id,
          RAWG_API_KEY
        );
        rememberRawg(cache, item, detailed);
        return detailed;
      } catch {
        return cached;
      }
    }
    return cached;
  }

  let rawg = item.rawgPreview || null;
  if (item.rawgId || item.slug) {
    rawg = await fetchRawgDetails(item.rawgId || item.slug, RAWG_API_KEY);
  } else if (item.title) {
    const results = await searchRawg(item.title, RAWG_API_KEY);
    const match = pickSearchResult(results, item.title, item.yearHint);
    if (match?.slug || match?.id) {
      try {
        rawg = await fetchRawgDetails(match.slug || match.id, RAWG_API_KEY);
      } catch {
        rawg = match;
      }
    }
  }
  if (rawg) rememberRawg(cache, item, rawg);
  return rawg;
}

function mergeGame(personal, rawg) {
  const preferJson = Boolean(personal.preferJson || personal.skipRawg);
  const jsonGenres = personal.genreHint
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const rawgGenres = rawg?.genres?.map((g) => g.name).filter(Boolean) || [];
  const genres = preferJson
    ? jsonGenres.length
      ? jsonGenres
      : rawgGenres
    : rawgGenres.length
      ? rawgGenres
      : jsonGenres;
  const rawgPlatforms =
    rawg?.parent_platforms
      ?.map((p) => p.platform?.name)
      .filter(Boolean) || [];
  const platforms = preferJson
    ? personal.platformHint.length
      ? personal.platformHint
      : rawgPlatforms
    : rawgPlatforms.length
      ? rawgPlatforms
      : personal.platformHint;

  const description = shortenText(
    stripHtml(
      pickMeta(
        personal.plot,
        rawg?.description_raw || rawg?.description,
        preferJson
      )
    )
  );

  return {
    key: personal.rawgId || personal.slug || `${personal.listIndex}-${personal.title}`,
    name: pickMeta(personal.title, rawg?.name, preferJson || personal.skipRawg) || "Untitled",
    backgroundImage: pickMeta(
      personal.poster,
      rawg?.background_image,
      preferJson
    ),
    releasedYear: pickMeta(
      personal.yearHint,
      yearFromDate(rawg?.released),
      preferJson
    ),
    genres,
    platforms,
    metacritic: typeof rawg?.metacritic === "number" ? rawg.metacritic : null,
    description,
    status: personal.status,
    notes: personal.notes,
    format: personal.format,
    score: personal.score,
    own: personal.own,
    rawgError: !rawg && !personal.skipRawg,
    skipRawg: Boolean(personal.skipRawg),
    needsMeta: gameNeedsRawgFetch(personal, rawg),
  };
}

function gameNeedsRawgFetch(personal, rawg) {
  if (personal.skipRawg) return false;
  const image = rawg?.background_image || personal.poster;
  const description = rawg?.description_raw || rawg?.description || personal.plot;
  return !image || !description;
}

export function libraryItemKey(item) {
  return item.rawgId || item.slug || `${item.listIndex}-${item.title}`;
}

function snapshotGames(personal, cache) {
  return personal.map((item) => {
    if (item.skipRawg) return mergeGame(item, null);
    const cached = lookupCachedRawg(cache, item) || item.rawgPreview || null;
    return mergeGame(item, cached);
  });
}

let metaCacheSingleton = null;

function getMetaCache() {
  if (!metaCacheSingleton) metaCacheSingleton = readMetaCache();
  return metaCacheSingleton;
}

let metaWriteTimer = 0;

function scheduleMetaWrite() {
  window.clearTimeout(metaWriteTimer);
  metaWriteTimer = window.setTimeout(() => {
    writeMetaCache(getMetaCache());
  }, 500);
}

async function loadPersonalItems(options = {}) {
  const waitForAccount = Boolean(options.waitForAccount);
  const list = await fetchJson(VIDEOGAMES_JSON_URL, { cache: "no-store" });
  if (!Array.isArray(list)) {
    throw new Error("Video game list JSON must be an array.");
  }

  const cdnItems = list.map(normalizeListItem).filter(isUsableListItem);
  let notice = missingUsernameNotice();
  let accountItems = [];

  if (RAWG_USERNAME) {
    const cachedAccount = readAccountCache();
    if (cachedAccount) {
      accountItems = cachedAccount;
    } else if (waitForAccount) {
      try {
        const accountGames = await fetchAllUserGames(RAWG_USERNAME, RAWG_API_KEY);
        accountItems = accountGames
          .map(normalizeUserGame)
          .filter(isUsableListItem);
        writeAccountCache(accountItems);
      } catch {
        notice =
          "Could not load RAWG account games. Showing the local list.";
      }
    }
  }

  return {
    personal: mergeLibraryItems(cdnItems, accountItems),
    notice,
  };
}

export async function loadLibraryShell() {
  if (!RAWG_API_KEY) {
    throw new Error("Missing VITE_RAWG_API_KEY. Add it to your local .env file.");
  }
  const { personal, notice } = await loadPersonalItems({ waitForAccount: false });
  const games = snapshotGames(personal, getMetaCache());
  return { personal, games, notice };
}

export async function enrichLibraryItem(item) {
  const cache = getMetaCache();
  try {
    if (item.skipRawg) return mergeGame(item, null);
    const rawg = await resolveRawg(item, cache);
    scheduleMetaWrite();
    return mergeGame(item, rawg);
  } catch {
    scheduleMetaWrite();
    return mergeGame(
      item,
      lookupCachedRawg(cache, item) || item.rawgPreview || null
    );
  }
}

export async function loadVideoGameLibrary() {
  const shell = await loadLibraryShell();
  const games = await mapPool(shell.personal, 4, (item) => enrichLibraryItem(item));
  writeMetaCache(getMetaCache());
  return { games, notice: shell.notice };
}

function missingUsernameNotice() {
  if (RAWG_USERNAME) return "";
  return "RAWG account games were skipped. Set VITE_RAWG_USERNAME to merge your profile list.";
}
