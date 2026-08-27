import { useEffect, useRef, useState } from "react";
import "../styles/Minesweeper.scss";
import {
  DIFFICULTIES,
  cloneBoard,
  countFlags,
  createEmptyBoard,
  flagRemainingMines,
  formatLcd,
  hasWon,
  placeMines,
  revealAllMines,
  revealFlood,
} from "../data/minesweeper";

const LONG_PRESS_MS = 450;
// Precision touchpads often report a left-click first, then the real
// right-click/contextmenu a moment later. Wait before revealing.
const MOUSE_RIGHT_CLICK_WAIT_MS = 200;

const isSecondaryClick = (event) =>
  event.button === 2 || event.which === 3;

const cellCoords = (event, fallback) => {
  const raw = event.target;
  const el = raw && raw.nodeType === 1 ? raw : raw?.parentElement;
  const cell = el?.closest?.("[data-row]");
  if (cell) {
    return {
      row: Number(cell.dataset.row),
      col: Number(cell.dataset.col),
    };
  }
  if (fallback && fallback.row != null) {
    return { row: fallback.row, col: fallback.col };
  }
  return null;
};

const Minesweeper = () => {
  document.title = "DEF Minesweeper";

  const [difficulty, setDifficulty] = useState("beginner");
  const config = DIFFICULTIES[difficulty];
  const [board, setBoard] = useState(() =>
    createEmptyBoard(config.rows, config.cols)
  );
  const [status, setStatus] = useState("ready");
  const [seconds, setSeconds] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [pressing, setPressing] = useState(false);

  const minesPlaced = useRef(false);
  const longPressTimer = useRef(null);
  const revealTimer = useRef(null);
  const gestureRef = useRef(null);
  const boardStateRef = useRef(board);
  const statusRef = useRef(status);
  const boardElRef = useRef(null);
  const difficultyRef = useRef(difficulty);
  const setPressingRef = useRef(setPressing);

  boardStateRef.current = board;
  statusRef.current = status;
  difficultyRef.current = difficulty;
  setPressingRef.current = setPressing;

  const startNewGame = (nextDifficulty = difficulty) => {
    const next = DIFFICULTIES[nextDifficulty];
    minesPlaced.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (revealTimer.current) clearTimeout(revealTimer.current);
    longPressTimer.current = null;
    revealTimer.current = null;
    gestureRef.current = null;
    setDifficulty(nextDifficulty);
    setBoard(createEmptyBoard(next.rows, next.cols));
    setStatus("ready");
    setSeconds(0);
    setTimerOn(false);
    setPressing(false);
  };

  useEffect(() => {
    if (!timerOn || status !== "playing") return undefined;
    const id = setInterval(() => {
      setSeconds((prev) => Math.min(999, prev + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timerOn, status]);

  useEffect(() => {
    const node = boardElRef.current;
    if (!node) return undefined;

    const clearLongPress = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    const clearRevealTimer = () => {
      if (revealTimer.current) {
        clearTimeout(revealTimer.current);
        revealTimer.current = null;
      }
    };

    const toggleFlag = (row, col) => {
      if (statusRef.current === "won" || statusRef.current === "lost") return;
      const current = boardStateRef.current;
      const cell = current[row][col];
      if (cell.revealed) return;
      const next = cloneBoard(current);
      next[row][col].flagged = !cell.flagged;
      boardStateRef.current = next;
      setBoard(next);
    };

    const revealCell = (row, col) => {
      if (statusRef.current === "won" || statusRef.current === "lost") return;
      let current = boardStateRef.current;
      const { rows, cols, mines } = DIFFICULTIES[difficultyRef.current];
      let cell = current[row][col];
      if (cell.revealed || cell.flagged) return;

      if (!minesPlaced.current) {
        current = placeMines(current, rows, cols, mines, row, col);
        minesPlaced.current = true;
        setTimerOn(true);
        setStatus("playing");
        cell = current[row][col];
      }

      if (cell.mine) {
        const lostBoard = revealAllMines(current, row, col);
        boardStateRef.current = lostBoard;
        setBoard(lostBoard);
        setStatus("lost");
        setTimerOn(false);
        return;
      }

      const revealed = revealFlood(current, rows, cols, row, col);
      if (hasWon(revealed)) {
        const wonBoard = flagRemainingMines(revealed);
        boardStateRef.current = wonBoard;
        setBoard(wonBoard);
        setStatus("won");
        setTimerOn(false);
        if (typeof window !== "undefined" && typeof window.confetti === "function") {
          window.confetti({
            particleCount: 1200,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        return;
      }
      boardStateRef.current = revealed;
      setBoard(revealed);
    };

    const flagGesture = (row, col) => {
      const gesture = gestureRef.current;
      if (gesture?.didFlag) return;
      if (gesture) {
        gesture.didFlag = true;
        gesture.secondary = true;
      }
      clearRevealTimer();
      toggleFlag(row, col);
    };

    const scheduleReveal = (gesture) => {
      if (!gesture || gesture.didFlag || gesture.secondary || gesture.didReveal) {
        return;
      }
      clearRevealTimer();
      const wait =
        gesture.pointerType === "touch" ? 0 : MOUSE_RIGHT_CLICK_WAIT_MS;
      revealTimer.current = setTimeout(() => {
        revealTimer.current = null;
        if (gesture.didFlag || gesture.secondary || gesture.didReveal) return;
        if (gestureRef.current !== gesture) return;
        gesture.didReveal = true;
        revealCell(gesture.row, gesture.col);
      }, wait);
    };

    const beginGesture = (event) => {
      const coords = cellCoords(event, gestureRef.current);
      if (!coords) return null;
      clearLongPress();
      clearRevealTimer();
      const gesture = {
        row: coords.row,
        col: coords.col,
        pointerType: event.pointerType || "mouse",
        secondary: isSecondaryClick(event) || (event.buttons & 2) === 2,
        didFlag: false,
        didReveal: false,
      };
      gestureRef.current = gesture;
      return gesture;
    };

    const onPointerDown = (event) => {
      const gesture = beginGesture(event);
      if (!gesture) return;

      if (gesture.secondary) {
        event.preventDefault();
        flagGesture(gesture.row, gesture.col);
        return;
      }

      if (event.button !== 0 && event.button !== undefined) return;

      setPressingRef.current(true);
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        longPressTimer.current = setTimeout(() => {
          flagGesture(gesture.row, gesture.col);
          longPressTimer.current = null;
        }, LONG_PRESS_MS);
      }
    };

    const onMouseDown = (event) => {
      const gesture = gestureRef.current;
      if (gesture?.pointerType === "touch" || gesture?.pointerType === "pen") {
        return;
      }
      if (!isSecondaryClick(event)) return;
      event.preventDefault();
      const next = gesture || beginGesture(event);
      if (!next) return;
      next.secondary = true;
      flagGesture(next.row, next.col);
    };

    const onPointerUp = (event) => {
      setPressingRef.current(false);
      clearLongPress();
      const gesture = gestureRef.current;
      if (!gesture) return;

      if (isSecondaryClick(event)) {
        gesture.secondary = true;
        flagGesture(gesture.row, gesture.col);
        return;
      }

      if (gesture.pointerType === "touch" || gesture.pointerType === "pen") {
        scheduleReveal(gesture);
      }
    };

    const onMouseUp = (event) => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      if (gesture.pointerType === "touch" || gesture.pointerType === "pen") {
        return;
      }

      if (isSecondaryClick(event)) {
        event.preventDefault();
        gesture.secondary = true;
        flagGesture(gesture.row, gesture.col);
        return;
      }

      if (event.button === 0) {
        scheduleReveal(gesture);
      }
    };

    const onAuxClick = (event) => {
      if (!isSecondaryClick(event)) return;
      event.preventDefault();
      const coords = cellCoords(event, gestureRef.current);
      if (!coords) return;
      if (gestureRef.current) gestureRef.current.secondary = true;
      flagGesture(coords.row, coords.col);
    };

    const onContextMenu = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const coords = cellCoords(event, gestureRef.current);
      if (!coords) return;
      if (gestureRef.current) gestureRef.current.secondary = true;
      flagGesture(coords.row, coords.col);
    };

    const onPointerCancel = () => {
      setPressingRef.current(false);
    };

    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("pointercancel", onPointerCancel);
    node.addEventListener("mousedown", onMouseDown);
    node.addEventListener("mouseup", onMouseUp);
    node.addEventListener("auxclick", onAuxClick);
    node.addEventListener("contextmenu", onContextMenu);

    return () => {
      clearLongPress();
      clearRevealTimer();
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerCancel);
      node.removeEventListener("mousedown", onMouseDown);
      node.removeEventListener("mouseup", onMouseUp);
      node.removeEventListener("auxclick", onAuxClick);
      node.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  const face =
    status === "lost"
      ? "😵"
      : status === "won"
        ? "😎"
        : pressing
          ? "😮"
          : "🙂";

  const minesLeft = config.mines - countFlags(board);

  return (
    <div id="minesweeper-wrap">
      <h1>Minesweeper</h1>
      <p className="howto">
        Left-click (or the left side of a clickpad) to reveal. Right-click,
        the right side of a clickpad, or two-finger tap to flag. On a touch
        screen, long-press to flag.
      </p>

      <div className="difficulty-row">
        {Object.values(DIFFICULTIES).map((option) => (
          <button
            key={option.id}
            type="button"
            className={option.id === difficulty ? "active" : ""}
            onClick={() => startNewGame(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="win98-window">
        <div className="title-bar">
          <span className="title-bar-text">Minesweeper</span>
          <div className="title-bar-controls" aria-hidden="true">
            <span>_</span>
            <span>□</span>
            <span>×</span>
          </div>
        </div>

        <div className="game-body">
          <div className="status-bar">
            <div className="lcd" aria-label={`Mines remaining ${minesLeft}`}>
              {formatLcd(minesLeft)}
            </div>
            <button
              type="button"
              className="face"
              onClick={() => startNewGame(difficulty)}
              aria-label="New game"
              title="New game"
            >
              {face}
            </button>
            <div className="lcd" aria-label={`Time ${seconds} seconds`}>
              {formatLcd(seconds)}
            </div>
          </div>

          <div className="board-scroll">
            <div
              ref={boardElRef}
              className={`board ${status}`}
              style={{
                gridTemplateColumns: `repeat(${config.cols}, var(--cell-size))`,
              }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    role="button"
                    tabIndex={0}
                    data-row={r}
                    data-col={c}
                    className={[
                      "cell",
                      cell.revealed ? "revealed" : "hidden",
                      cell.flagged ? "flagged" : "",
                      cell.exploded ? "exploded" : "",
                      cell.wrongFlag ? "wrong" : "",
                      cell.revealed && cell.adjacent ? `n${cell.adjacent}` : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-label={
                      cell.revealed
                        ? cell.mine
                          ? "Mine"
                          : cell.adjacent
                            ? `${cell.adjacent} adjacent mines`
                            : "Empty"
                        : cell.flagged
                          ? "Flagged"
                          : "Hidden cell"
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (statusRef.current === "won" || statusRef.current === "lost") {
                          return;
                        }
                        const current = boardStateRef.current;
                        const cellAt = current[r][c];
                        if (cellAt.revealed || cellAt.flagged) return;
                        let nextBoard = current;
                        const { rows, cols, mines } =
                          DIFFICULTIES[difficultyRef.current];
                        if (!minesPlaced.current) {
                          nextBoard = placeMines(
                            current,
                            rows,
                            cols,
                            mines,
                            r,
                            c
                          );
                          minesPlaced.current = true;
                          setTimerOn(true);
                          setStatus("playing");
                        }
                        const cellAfter = nextBoard[r][c];
                        if (cellAfter.mine) {
                          const lostBoard = revealAllMines(nextBoard, r, c);
                          boardStateRef.current = lostBoard;
                          setBoard(lostBoard);
                          setStatus("lost");
                          setTimerOn(false);
                          return;
                        }
                        const revealed = revealFlood(nextBoard, rows, cols, r, c);
                        if (hasWon(revealed)) {
                          const wonBoard = flagRemainingMines(revealed);
                          boardStateRef.current = wonBoard;
                          setBoard(wonBoard);
                          setStatus("won");
                          setTimerOn(false);
                          return;
                        }
                        boardStateRef.current = revealed;
                        setBoard(revealed);
                      } else if (event.key === "f" || event.key === "F") {
                        event.preventDefault();
                        if (statusRef.current === "won" || statusRef.current === "lost") {
                          return;
                        }
                        const current = boardStateRef.current;
                        const cellAt = current[r][c];
                        if (cellAt.revealed) return;
                        const next = cloneBoard(current);
                        next[r][c].flagged = !cellAt.flagged;
                        boardStateRef.current = next;
                        setBoard(next);
                      }
                    }}
                  >
                    {cell.wrongFlag ? (
                      <span className="mine-icon wrong-x">×</span>
                    ) : cell.revealed && cell.mine ? (
                      <span className="mine-icon">●</span>
                    ) : cell.flagged && !cell.revealed ? (
                      <span className="flag-icon">🚩</span>
                    ) : cell.revealed && cell.adjacent > 0 ? (
                      cell.adjacent
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Minesweeper;
