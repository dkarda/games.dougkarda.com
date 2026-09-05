import { useQuery } from "@tanstack/react-query";
import {
  loadVideoGameLibrary,
  statusLabel,
} from "../data/videogames";
import "../styles/VideoGames.scss";

const VideoGames = () => {
  document.title = "DEF Video Games";

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["videogames-library-v2"],
    queryFn: loadVideoGameLibrary,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

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

      {!isPending && !isError && (!data?.games || data.games.length === 0) ? (
        <p className="videogames-status">No games in the list yet.</p>
      ) : null}

      {data?.games?.length ? (
        <ul className="videogames-grid">
          {[...data.games]
            .sort((a, b) => {
              const nameA = String(a.name ?? "").trim();
              const nameB = String(b.name ?? "").trim();
              if (!nameA && !nameB) return 0;
              if (!nameA) return 1;
              if (!nameB) return -1;
              return nameA.localeCompare(nameB, undefined, {
                sensitivity: "base",
              });
            })
            .map((game) => (
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
