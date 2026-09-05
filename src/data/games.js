import videogamesIcon from "../assets/videogames-icon.svg";

export const games = [
  {
    id: "concentration",
    name: "Concentration",
    path: "/concentration",
    icon: "https://assets.dougkarda.com/images/icons/icon-concentration-trans.png",
    description: "Flip cards and match pairs across themed sets.",
  },
  {
    id: "minesweeper",
    name: "Minesweeper",
    path: "/minesweeper",
    icon: "/minesweeper-icon.svg",
    description: "Clear the board without hitting a mine. Classic rules, Win98 look.",
  },
  {
    id: "videogames",
    name: "Video Games",
    path: "/videogames",
    icon: videogamesIcon,
    description: "A library of games I play, with covers and details from RAWG.",
    cta: "Browse",
    isNew: true,
  },
];
