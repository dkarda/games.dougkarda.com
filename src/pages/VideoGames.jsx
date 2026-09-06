import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  loadVideoGameLibrary,
  statusLabel,
} from "../data/videogames";
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

const VideoGames = () => {
  document.title = "DEF Video Games";
  const [query, setQuery] = useState("");

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["videogames-library-v4"],
    queryFn: loadVideoGameLibrary,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const sortedGames = useMemo(() => {
    const games = data?.games || [];
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
  }, [data?.games]);

  const filteredGames = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sortedGames;
    return sortedGames.filter((game) => gameSearchText(game).includes(needle));
  }, [sortedGames, query]);

  const hasLibrary = Boolean(data?.games?.length);

  return (
    <div id="videogames-wrap">
      <header className="videogames-intro">
        <h1>Video game library</h1>
        <p>
          Games I own or play, with covers and details from RAWG. Status and
          notes come from a list I host on the CDN, merged with my RAWG
          profile.
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

      {!isPending && !isError && data?.notice ? (
        <p className="videogames-status">{data.notice}</p>
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
            <li key={game.key} className="videogame-card">
              <div className="videogame-cover">
                {game.backgroundImage ? (
                  <img src={game.backgroundImage} alt="" />
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
                  {[
                    game.releasedYear,
                    game.genres.slice(0, 3).join(", "),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {game.platforms.length ? (
                  <p className="videogame-platforms">
                    {game.platforms.join(" · ")}
                  </p>
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
                ) : game.rawgError ? (
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
          ))}
        </ul>
      ) : null}

      {isFetching && !isPending ? (
        <p className="videogames-status">Refreshing…</p>
      ) : null}
    </div>
  );
};

export default VideoGames;
