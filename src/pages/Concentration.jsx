import { useEffect, useState } from "react";
import "../styles/Concentration.scss";
import ConcentrationCard from "../components/ConcentrationCard";
import {
  cardImageBackBaseball,
  cardImageBackHockey,
  cardImageBackRockAlbums,
  cardImageBackHalloween,
  cardImagesALEast,
  cardImagesALCentral,
  cardImagesALWest,
  cardImagesNLEast,
  cardImagesNLCentral,
  cardImagesNLWest,
  cardImagesHockey,
  cardImagesRockAlbums,
  cardImagesHalloween,
} from "../data/concentration";

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const Concentration = () => {
  document.title = "DEF Concentration Game";

  const [cards, setCards] = useState([]);
  const [cardsBack, setCardsBack] = useState([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [matches, setMatches] = useState(0);
  const [theme, setTheme] = useState("baseball");
  let themedCardImages = [];

  const pairCount = cards.length / 2;
  const won = matches > 0 && matches === pairCount;

  const shuffleCards = () => {
    switch (theme) {
      case "rockalbums":
        setCardsBack(cardImageBackRockAlbums);
        themedCardImages = cardImagesRockAlbums.concat(cardImagesRockAlbums);
        break;
      case "baseball":
        setCardsBack(cardImageBackBaseball);
        themedCardImages = cardImagesALEast.concat(cardImagesALEast);
        break;
      case "hockey":
        setCardsBack(cardImageBackHockey);
        themedCardImages = cardImagesHockey.concat(cardImagesHockey);
        break;
      case "halloween":
        setCardsBack(cardImageBackHalloween);
        themedCardImages = cardImagesHalloween.concat(cardImagesHalloween);
        break;
      default:
        break;
    }
    let gameCards = shuffleArray([...themedCardImages]);
    gameCards = gameCards.map((card) => ({ ...card, id: Math.random() }));
    setCards(gameCards);
    setTurns(0);
    setMatches(0);
    setChoiceOne(null);
    setChoiceTwo(null);
  };

  const handleChoice = (card) => {
    choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
  };

  const handleDropdownChange = (e) => {
    setTheme(e.target.value);
  };

  useEffect(() => {
    if (choiceOne && choiceTwo) {
      setDisabled(true);
      if (choiceOne.src === choiceTwo.src) {
        setMatches((prevMatches) => prevMatches + 1);
        setCards((prevCards) => {
          return prevCards.map((card) => {
            if (card.src === choiceOne.src) {
              return { ...card, matched: true };
            } else {
              return card;
            }
          });
        });
        resetTurn();
      } else {
        setTimeout(() => resetTurn(), 1000);
      }
    }
  }, [choiceOne, choiceTwo]);

  useEffect(() => {
    if (won && typeof window !== "undefined" && typeof window.confetti === "function") {
      window.confetti({
        particleCount: 2000,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [won]);

  useEffect(() => {
    setTheme(theme);
    shuffleCards();
  }, [theme]);

  useEffect(() => {
    shuffleCards();
  }, []);

  const resetTurn = () => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns((prevTurns) => prevTurns + 1);
    setDisabled(false);
  };

  return (
    <div id="concentration-wrap" className={theme}>
      <header className="game-header">
        <h1>Concentration</h1>
        <p>Flip two cards and find every pair.</p>
      </header>

      <div className="toolbar">
        <button type="button" className="new-game" onClick={shuffleCards}>
          New game
        </button>
        <label className="theme-picker" htmlFor="gameTheme">
          <span>Theme</span>
          <select
            id="gameTheme"
            name="gameTheme"
            value={theme}
            onChange={handleDropdownChange}
          >
            <option value="baseball">
              Baseball AL East ({cardImagesALEast.length * 2} cards)
            </option>
            <option value="halloween">
              Halloween ({cardImagesHalloween.length * 2} cards)
            </option>
            <option value="hockey">
              Hockey ({cardImagesHockey.length * 2} cards)
            </option>
            <option value="rockalbums">
              Rock Albums ({cardImagesRockAlbums.length * 2} cards)
            </option>
          </select>
        </label>
        <div className="stats">
          <div className="stat">
            <span>Turns</span>
            <strong>{turns}</strong>
          </div>
          <div className="stat">
            <span>Matches</span>
            <strong>
              {matches}
              {pairCount ? ` / ${pairCount}` : ""}
            </strong>
          </div>
        </div>
      </div>

      {won ? (
        <p className="win-banner" role="status">
          You found them all in {turns} turns.
        </p>
      ) : null}

      <div className="card-grid">
        {cards.map((card) => (
          <ConcentrationCard
            key={card.id}
            card={card}
            handleChoice={handleChoice}
            flipped={card === choiceOne || card === choiceTwo || card.matched}
            disabled={disabled}
            cardBackImg={cardsBack}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
};

export default Concentration;
