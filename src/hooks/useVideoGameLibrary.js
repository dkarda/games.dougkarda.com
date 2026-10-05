import { useCallback, useEffect, useRef, useState } from "react";
import {
  enrichLibraryItem,
  hydrateLibraryFromCache,
  libraryItemKey,
  loadLibraryShell,
} from "../data/videogames";

const ENRICH_CONCURRENCY = 3;

export function useVideoGameLibrary() {
  const [games, setGames] = useState([]);
  const [notice, setNotice] = useState("");
  const [isPending, setIsPending] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const personalByKey = useRef(new Map());
  const queued = useRef(new Set());
  const queue = useRef([]);
  const active = useRef(0);
  const cancelled = useRef(false);
  const hydrateHandle = useRef(0);

  const applyGame = useCallback((game) => {
    setGames((current) => {
      const index = current.findIndex((entry) => entry.key === game.key);
      if (index < 0) return [...current, game];
      if (current[index] === game) return current;
      const next = current.slice();
      next[index] = game;
      return next;
    });
  }, []);

  const pump = useCallback(() => {
    while (active.current < ENRICH_CONCURRENCY && queue.current.length) {
      const item = queue.current.shift();
      active.current += 1;
      setIsEnriching(true);
      enrichLibraryItem(item)
        .then((game) => {
          if (!cancelled.current) applyGame(game);
        })
        .finally(() => {
          active.current -= 1;
          if (!cancelled.current) pump();
          if (active.current === 0 && queue.current.length === 0) {
            setIsEnriching(false);
          }
        });
    }
  }, [applyGame]);

  const requestEnrich = useCallback(
    (gameKey) => {
      const item = personalByKey.current.get(gameKey);
      if (!item || queued.current.has(gameKey)) return;
      queued.current.add(gameKey);
      queue.current.push(item);
      pump();
    },
    [pump]
  );

  const load = useCallback(async () => {
    cancelled.current = false;
    setIsPending(true);
    setIsError(false);
    setError(null);
    queued.current = new Set();
    queue.current = [];
    active.current = 0;
    try {
      const shell = await loadLibraryShell();
      if (cancelled.current) return;
      personalByKey.current = new Map(
        shell.personal.map((item) => [libraryItemKey(item), item])
      );
      setGames(shell.games);
      setNotice(shell.notice || "");
      setIsPending(false);

      const hydrate = () => {
        hydrateHandle.current = 0;
        if (cancelled.current) return;
        const hydrated = hydrateLibraryFromCache(shell.personal);
        if (cancelled.current) return;
        personalByKey.current = new Map(
          hydrated.personal.map((item) => [libraryItemKey(item), item])
        );
        setGames((current) => {
          const byKey = new Map(hydrated.games.map((game) => [game.key, game]));
          const seen = new Set();
          const next = current.map((game) => {
            seen.add(game.key);
            const cached = byKey.get(game.key);
            if (!cached) return game;
            if (!game.needsMeta && (game.description || game.backgroundImage)) {
              return game;
            }
            return cached;
          });
          for (const game of hydrated.games) {
            if (!seen.has(game.key)) next.push(game);
          }
          return next;
        });
      };
      if (typeof window.requestIdleCallback === "function") {
        hydrateHandle.current = window.requestIdleCallback(hydrate, {
          timeout: 400,
        });
      } else {
        hydrateHandle.current = window.setTimeout(hydrate, 0);
      }
    } catch (err) {
      if (cancelled.current) return;
      setIsError(true);
      setError(err);
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    load();
    return () => {
      cancelled.current = true;
      if (hydrateHandle.current) {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(hydrateHandle.current);
        }
        window.clearTimeout(hydrateHandle.current);
      }
    };
  }, [load]);

  return {
    games,
    notice,
    isPending,
    isError,
    error,
    isEnriching,
    refetch: load,
    requestEnrich,
  };
}
