const DEFAULT_JSON_URL = "https://assets.dougkarda.com/data/videogames.json";
const RAWG_BASE = "https://api.rawg.io/api";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const RAWG_PAGE_SIZE = 40;
const RAWG_MAX_PAGES = 80;

export const VIDEOGAMES_JSON_URL =
  import.meta.env.VITE_VIDEOGAMES_JSON_URL || DEFAULT_JSON_URL;

export const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || "";
export const RAWG_USERNAME = String(
  import.meta.env.VITE_RAWG_USERNAME || ""
).trim();

const CACHE_KEY = `videogames-library-v2:${RAWG_USERNAME || "cdn-only"}`;

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
  const slug = item.slug ?? item.Slug ?? "";
  const rawgId = item.rawgId ?? item.rawg_id ?? null;
  return {
    listIndex: index,
    title,
    slug: slug ? String(slug) : "",
    rawgId: rawgId != null && rawgId !== "" ? String(rawgId) : "",
    status: normalizeStatus(item),
    notes: notesFromItem(item),
    format: item.format ? String(item.format) : "",
    score: typeof item.score === "number" ? item.score : null,
    own: item.own === "y" || item.own === true,
    poster: item.Poster && item.Poster !== "N/A" ? item.Poster : "",
    yearHint: item.Year ? String(item.Year).slice(0, 4) : "",
    plot: item.Plot && item.Plot !== "N/A" ? String(item.Plot) : "",
    genreHint: item.Genre && item.Genre !== "N/A" ? String(item.Genre) : "",
  };
}

export function isUsableListItem(item) {
  return Boolean(item.slug || item.rawgId || item.title);
}

function yearFromDate(released) {
  if (!released) return "";
  return String(released).slice(0, 4);
}

function pickSearchResult(results, title, yearHint) {
  if (!results?.length) return null;
  const needle = title.toLowerCase();
  const scored = results.map((game) => {
    const name = (game.name || "").toLowerCase();
    let score = 0;
    if (name === needle) score += 8;
    else if (name.includes(needle) || needle.includes(name)) score += 4;
    const year = yearFromDate(game.released);
    if (yearHint && year === yearHint) score += 5;
    return { game, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].game;
}

async function fetchJson(url) {
  const res = await fetch(url);
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

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      return null;
    }
    return parsed.games || null;
  } catch {
    return null;
  }
}

function writeCache(games) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), games })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

function mergeGame(personal, rawg) {
  const description = shortenText(
    stripHtml(rawg?.description_raw || rawg?.description || personal.plot)
  );
  const genres =
    rawg?.genres?.map((g) => g.name).filter(Boolean) ||
    personal.genreHint.split(",").map((g) => g.trim()).filter(Boolean);
  const platforms =
    rawg?.parent_platforms
      ?.map((p) => p.platform?.name)
      .filter(Boolean) || [];

  return {
    key: personal.rawgId || personal.slug || `${personal.listIndex}-${personal.title}`,
    name: rawg?.name || personal.title || "Untitled",
    backgroundImage: rawg?.background_image || personal.poster || "",
    releasedYear: yearFromDate(rawg?.released) || personal.yearHint,
    genres,
    platforms,
    metacritic: typeof rawg?.metacritic === "number" ? rawg.metacritic : null,
    description,
    status: personal.status,
    notes: personal.notes,
    format: personal.format,
    score: personal.score,
    own: personal.own,
    rawgError: !rawg,
  };
}

function missingUsernameNotice() {
  if (RAWG_USERNAME) return "";
  return "RAWG account games were skipped. Set VITE_RAWG_USERNAME to merge your profile list.";
}

export async function loadVideoGameLibrary() {
  if (!RAWG_API_KEY) {
    throw new Error("Missing VITE_RAWG_API_KEY. Add it to your local .env file.");
  }

  const cached = readCache();
  if (cached) {
    return { games: cached, notice: missingUsernameNotice() };
  }

  const list = await fetchJson(VIDEOGAMES_JSON_URL);
  if (!Array.isArray(list)) {
    throw new Error("Video game list JSON must be an array.");
  }

  const cdnItems = list.map(normalizeListItem).filter(isUsableListItem);

  let notice = missingUsernameNotice();
  let accountItems = [];
  let accountOk = !RAWG_USERNAME;

  if (RAWG_USERNAME) {
    try {
      const accountGames = await fetchAllUserGames(RAWG_USERNAME, RAWG_API_KEY);
      accountItems = accountGames
        .map(normalizeUserGame)
        .filter(isUsableListItem);
      accountOk = true;
    } catch {
      notice =
        "Could not load RAWG account games. Showing the CDN list.";
      accountOk = false;
    }
  }

  const personal = mergeLibraryItems(cdnItems, accountItems);

  const games = await mapPool(personal, 4, async (item) => {
    try {
      let rawg = item.rawgPreview || null;
      if (!rawg) {
        if (item.rawgId || item.slug) {
          rawg = await fetchRawgDetails(item.rawgId || item.slug, RAWG_API_KEY);
        } else {
          const results = await searchRawg(item.title, RAWG_API_KEY);
          const match = pickSearchResult(results, item.title, item.yearHint);
          if (match?.slug || match?.id) {
            rawg = await fetchRawgDetails(match.slug || match.id, RAWG_API_KEY);
          }
        }
      }
      return mergeGame(item, rawg);
    } catch {
      return mergeGame(item, item.rawgPreview || null);
    }
  });

  if (accountOk) writeCache(games);
  return { games, notice };
}
