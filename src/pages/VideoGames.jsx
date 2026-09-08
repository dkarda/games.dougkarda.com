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

  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      const nameA = String(a.name ?? "").trim();
      const nameB = String(b.name ?? "").trim();
      if (!nameA && !nameB) return 0;
      if (!nameA) return 1;
      if (!nameB) return -1;
      return nameA.localeCompare(nameB, undefined, {
        sensitivity: "base",
      });
    });
  }, [games]);

  const filteredGames = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sortedGames;
    return sortedGames.filter((game) => gameSearchText(game).includes(needle));
  }, [sortedGames, query]);

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
          <p className="videogames-count" aria-live="polite">
            {query.trim()
              ? `${filteredGames.length} of ${sortedGames.length}`
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

      {hasLibrary && query.trim() && filteredGames.length === 0 ? (
        <p className="videogames-status">No games match that search.</p>
      ) : null}

      {filteredGames.length ? (
        <ul className="videogames-grid">
          {filteredGames.map((game) => (
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
