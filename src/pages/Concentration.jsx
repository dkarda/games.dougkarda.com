import { useEffect, useState } from "react";
import "../styles/Concentration.scss";
import ConcentrationCard from "../components/ConcentrationCard";
import {
  cardImagesALEast,
  cardImagesALCentral,
  cardImagesALWest,
  cardImagesNLEast,
  cardImagesNLCentral,
  cardImagesNLWest,
  cardImagesHockey,
  cardImagesRockAlbums,
  cardImageBackBaseball,
  cardImageBackHockey,
  cardImageBackRockAlbums,
} from "../data/concentration";

//Fisher-Yates (or Knuth) shuffle algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

const Concentration = () => {
  document.title = "DEF Concentration Game";

  const [cards, setCards] = useState([]);
  const [cardsBack, setCardsBack] = useState([cardImageBackRockAlbums]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [matches, setMatches] = useState(0);
  const [theme, setTheme] = useState("rockalbums");
  let themedCardImages = cardImagesRockAlbums.concat(cardImagesRockAlbums);

  //shuffle cards
  const shuffleCards = () => {
    if (theme === "rockalbums") {
      setCardsBack(cardImageBackRockAlbums);
      themedCardImages = cardImagesRockAlbums.concat(cardImagesRockAlbums);
    } else if (theme === "baseball") {
      setCardsBack(cardImageBackBaseball);
      themedCardImages = cardImagesALEast.concat(cardImagesALEast);
    } else if (theme === "hockey") {
      setCardsBack(cardImageBackHockey);
      themedCardImages = cardImagesHockey.concat(cardImagesHockey);
    }
    let gameCards = shuffleArray([...themedCardImages]);
    gameCards = gameCards.map((card) => ({ ...card, id: Math.random() }));
    setCards(gameCards);
    setTurns(0);
    setMatches(0);
    setChoiceOne(null);
    setChoiceTwo(null);
  };

  //handle a choice
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
    if (matches > 0 && matches === cards.length / 2) {
      console.log("GAME OVER");
      confetti({
        particleCount: 2000,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [matches]);

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
    <div id="concentration-wrap">
      <h1>Concentration Game</h1>
      <div className="select-row">
        <button onClick={shuffleCards}>New Game</button>
        <div className="custom-select-wrap">
          <label htmlFor="gameTheme">
            <b>
              Game
              <br />
              Theme
            </b>
          </label>
          <select
            id="gameTheme"
            name="gameTheme"
            value={theme}
            onChange={handleDropdownChange}
          >
            <option value="baseball">Baseball</option>
            <option value="hockey">Hockey</option>
            <option value="rockalbums">Rock Albums</option>
          </select>
        </div>
        <div>
          <span>Turns: {turns}</span>
          <br />
          <span>Matches: {matches}</span>
        </div>
      </div>
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
