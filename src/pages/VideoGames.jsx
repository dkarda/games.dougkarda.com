import { useEffect, useMemo, useRef, useState } from "react";
import { statusLabel } from "../data/videogames";
import { useVideoGameLibrary } from "../hooks/useVideoGameLibrary";
import "../styles/VideoGames.scss";

function gameSearchText(game) {
  return [
    game.name,
    game.releasedYear,
    statusLabel(game.status),
    game.notes,
    game.format,
    ...(game.genres || []),
    ...(game.platforms || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const PLAYED_STATUSES = new Set([
  "playing",
  "played",
  "complete",
  "completed",
  "beaten",
  "dropped",
]);

function isPlayed(game) {
  return PLAYED_STATUSES.has(String(game.status || "").toLowerCase());
}

function compareNames(a, b) {
  const nameA = String(a.name ?? "").trim();
  const nameB = String(b.name ?? "").trim();
  if (!nameA && !nameB) return 0;
  if (!nameA) return 1;
  if (!nameB) return -1;
  return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
}

function compareYears(a, b) {
  const yearA = Number.parseInt(a.releasedYear, 10);
  const yearB = Number.parseInt(b.releasedYear, 10);
  const hasA = Number.isFinite(yearA);
  const hasB = Number.isFinite(yearB);
  if (hasA && hasB && yearA !== yearB) return yearB - yearA;
  if (hasA !== hasB) return hasA ? -1 : 1;
  return compareNames(a, b);
}

function compareScores(a, b) {
  const scoreA = typeof a.score === "number" ? a.score : null;
  const scoreB = typeof b.score === "number" ? b.score : null;
  const hasA = scoreA != null && scoreA > 0;
  const hasB = scoreB != null && scoreB > 0;
  if (hasA && hasB && scoreA !== scoreB) return scoreB - scoreA;
  if (hasA !== hasB) return hasA ? -1 : 1;
  return compareNames(a, b);
}

function VideoGameCard({ game, onVisible }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!game.needsMeta || !onVisible) return undefined;
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible(game.key);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [game.key, game.needsMeta, onVisible]);

  return (
    <li ref={ref} className="videogame-card">
      <div className="videogame-cover">
        {game.backgroundImage ? (
          <img
            src={game.backgroundImage}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="videogame-cover-fallback" aria-hidden="true" />
        )}
        {game.status ? (
          <span className={`videogame-badge status-${game.status}`}>
            {statusLabel(game.status)}
          </span>
        ) : null}
      </div>
      <div className="videogame-body">
        <h2>{game.name}</h2>
        <p className="videogame-meta">
          {[game.releasedYear, game.genres.slice(0, 3).join(", ")]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {game.platforms.length ? (
          <p className="videogame-platforms">{game.platforms.join(" · ")}</p>
        ) : null}
        <div className="videogame-scores">
          {game.metacritic != null ? (
            <span className="videogame-metacritic">
              Metacritic {game.metacritic}
            </span>
          ) : null}
          {game.score ? (
            <span className="videogame-myscore">My score {game.score}</span>
          ) : null}
        </div>
        {game.description ? (
          <p className="videogame-desc">{game.description}</p>
        ) : game.rawgError && !game.needsMeta ? (
          <p className="videogame-desc muted">
            RAWG metadata unavailable for this title.
          </p>
        ) : null}
        {game.format ? (
          <p className="videogame-format">{game.format}</p>
        ) : null}
        {game.notes ? (
          <p className="videogame-notes">{game.notes}</p>
        ) : null}
      </div>
    </li>
  );
}

const VideoGames = () => {
  document.title = "DEF Video Games";
  const [query, setQuery] = useState("");
  const [playFilter, setPlayFilter] = useState("all");
  const [sortBy, setSortBy] = useState("alpha");
  const {
    games,
    notice,
    isPending,
    isError,
    error,
    isEnriching,
    refetch,
    requestEnrich,
  } = useVideoGameLibrary();

  const filteredGames = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return games.filter((game) => {
      if (playFilter === "played" && !isPlayed(game)) return false;
      if (playFilter === "unplayed" && isPlayed(game)) return false;
      if (needle && !gameSearchText(game).includes(needle)) return false;
      return true;
    });
  }, [games, playFilter, query]);

  const sortedGames = useMemo(() => {
    const next = [...filteredGames];
    if (sortBy === "year") next.sort(compareYears);
    else if (sortBy === "score") next.sort(compareScores);
    else next.sort(compareNames);
    return next;
  }, [filteredGames, sortBy]);

  const hasLibrary = Boolean(games.length);

  return (
    <div id="videogames-wrap">
      <header className="videogames-intro">
        <h1>Video game library</h1>
        <p>
          Games I own or play, with covers and details from RAWG. Status and
          notes come from a list in this repo, merged with my RAWG profile.
        </p>
      </header>

      {hasLibrary ? (
        <div className="videogames-toolbar">
          <label className="videogames-search">
            <span className="videogames-select-label">Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, genres, platforms…"
              aria-label="Search games"
              autoComplete="off"
              spellCheck="false"
            />
          </label>
          <label className="videogames-select">
            <span className="videogames-select-label">Status</span>
            <select
              value={playFilter}
              onChange={(event) => setPlayFilter(event.target.value)}
              aria-label="Filter by played status"
            >
              <option value="all">All games</option>
              <option value="played">Played</option>
              <option value="unplayed">Unplayed</option>
            </select>
          </label>
          <label className="videogames-select">
            <span className="videogames-select-label">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort games"
            >
              <option value="alpha">A–Z</option>
              <option value="year">Release year</option>
              <option value="score">My score</option>
            </select>
          </label>
          <p className="videogames-count" aria-live="polite">
            {playFilter !== "all" || query.trim()
              ? `${sortedGames.length} of ${games.length}`
              : `${sortedGames.length} games`}
            {isEnriching ? " · loading details…" : ""}
          </p>
        </div>
      ) : null}

      {isPending ? (
        <p className="videogames-status" role="status">
          Loading library…
        </p>
      ) : null}

      {isError ? (
        <div className="videogames-status videogames-error" role="alert">
          <p>{error?.message || "Could not load the video game library."}</p>
          <button type="button" className="button" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : null}

      {!isPending && !isError && notice ? (
        <p className="videogames-status">{notice}</p>
      ) : null}

      {!isPending && !isError && !hasLibrary ? (
        <p className="videogames-status">No games in the list yet.</p>
      ) : null}

      {hasLibrary && sortedGames.length === 0 ? (
        <p className="videogames-status">No games match those filters.</p>
      ) : null}

      {sortedGames.length ? (
        <ul className="videogames-grid">
          {sortedGames.map((game) => (
            <VideoGameCard
              key={game.key}
              game={game}
              onVisible={requestEnrich}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default VideoGames;
