import { useEffect, useState } from "react";
import "../styles/Concentration.scss";
import ConcentrationCard from "../components/ConcentrationCard";

//Fisher-Yates (or Knuth) shuffle algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

const imgBaseUrlBaseball =
  import.meta.env.VITE_IMG_BASE_URL + "sports/logos/baseball/";
const imgBaseUrlHockey =
  import.meta.env.VITE_IMG_BASE_URL + "sports/logos/hockey/";
const imgBaseUrlRockAlbums =
  import.meta.env.VITE_IMG_BASE_URL + "music/albums/";

const cardImageBackBaseball = imgBaseUrlBaseball + "baseball.png";
const cardImageBackHockey = imgBaseUrlHockey + "nhl-shield.svg";
const cardImageBackRockAlbums = imgBaseUrlRockAlbums + "album-plain.webp";

const cardImagesALEast = [
  { src: imgBaseUrlBaseball + "bluejays.svg", matched: false },
  { src: imgBaseUrlBaseball + "orioles.svg", matched: false },
  { src: imgBaseUrlBaseball + "rays.svg", matched: false },
  { src: imgBaseUrlBaseball + "redsox.svg", matched: false },
  { src: imgBaseUrlBaseball + "yankees.svg", matched: false },
];
const cardImagesALCentral = [
  { src: imgBaseUrlBaseball + "guardians.svg", matched: false },
  { src: imgBaseUrlBaseball + "royals.svg", matched: false },
  { src: imgBaseUrlBaseball + "tigers.svg", matched: false },
  { src: imgBaseUrlBaseball + "twins.svg", matched: false },
  { src: imgBaseUrlBaseball + "whitesox.svg", matched: false },
];
const cardImagesALWest = [
  { src: imgBaseUrlBaseball + "angels.svg", matched: false },
  { src: imgBaseUrlBaseball + "astros.svg", matched: false },
  { src: imgBaseUrlBaseball + "athletics.svg", matched: false },
  { src: imgBaseUrlBaseball + "mariners.svg", matched: false },
  { src: imgBaseUrlBaseball + "rangers.svg", matched: false },
];
const cardImagesNLEast = [
  { src: imgBaseUrlBaseball + "braves.svg", matched: false },
  { src: imgBaseUrlBaseball + "marlins.svg", matched: false },
  { src: imgBaseUrlBaseball + "mets.svg", matched: false },
  { src: imgBaseUrlBaseball + "nationals.svg", matched: false },
  { src: imgBaseUrlBaseball + "phillies.svg", matched: false },
];
const cardImagesNLCentral = [
  { src: imgBaseUrlBaseball + "brewers.svg", matched: false },
  { src: imgBaseUrlBaseball + "cardinals.svg", matched: false },
  { src: imgBaseUrlBaseball + "cubs.svg", matched: false },
  { src: imgBaseUrlBaseball + "pirates.svg", matched: false },
  { src: imgBaseUrlBaseball + "reds.svg", matched: false },
];
const cardImagesNLWest = [
  { src: imgBaseUrlBaseball + "diamondbacks.svg", matched: false },
  { src: imgBaseUrlBaseball + "dodgers.svg", matched: false },
  { src: imgBaseUrlBaseball + "giants.svg", matched: false },
  { src: imgBaseUrlBaseball + "padres.svg", matched: false },
  { src: imgBaseUrlBaseball + "rockies.svg", matched: false },
];
const cardImagesHockey = [
  { src: imgBaseUrlHockey + "rangers.svg", matched: false },
  { src: imgBaseUrlHockey + "redwings.svg", matched: false },
  { src: imgBaseUrlHockey + "blackhawks.svg", matched: false },
  { src: imgBaseUrlHockey + "mapleleafs.svg", matched: false },
  { src: imgBaseUrlHockey + "bruins.svg", matched: false },
  { src: imgBaseUrlHockey + "canadiens.svg", matched: false },
  { src: imgBaseUrlHockey + "hurricanes.svg", matched: false },
  { src: imgBaseUrlHockey + "bluejackets.svg", matched: false },
  { src: imgBaseUrlHockey + "stars.svg", matched: false },
  { src: imgBaseUrlHockey + "penguins.svg", matched: false },
  { src: imgBaseUrlHockey + "lightning.svg", matched: false },
  { src: imgBaseUrlHockey + "sharks.svg", matched: false },
  { src: imgBaseUrlHockey + "goldenknights.svg", matched: false },
  { src: imgBaseUrlHockey + "mammoth.svg", matched: false },
  { src: imgBaseUrlHockey + "oilers.svg", matched: false },
];
const cardImagesRockAlbums = [
  { src: imgBaseUrlRockAlbums + "aerosmith-toysintheattic.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "eagles-hotelcalifornia.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "led-zeppelin-iv.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "lynyrdskynyrd-pronouncedlehnerdskinnerd.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "patbenatar-getnervous.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "queen-anightattheopera.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "rush-moving-pictures.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "styx-piecesofeight.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "thewho-whosnext.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "van-halen-i.webp", matched: false },
];

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
      themedCardImages = cardImagesHockey;
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
  }

  useEffect(() => {
    if (choiceOne && choiceTwo) {
      setDisabled(true);
      if (choiceOne.src === choiceTwo.src) {
        setMatches(prevMatches => prevMatches + 1);
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
          <label htmlFor="gameTheme"><b>Game<br />Theme</b></label>
          <select id="gameTheme" name="gameTheme" value={theme} onChange={handleDropdownChange}>
            <option value="baseball">Baseball</option>
            <option value="hockey">Hockey</option>
            <option value="rockalbums">Rock Albums</option>
          </select>
        </div>
        <div>
          <span>Turns: {turns}</span><br />
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
