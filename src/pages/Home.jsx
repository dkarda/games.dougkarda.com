import { Link } from "react-router-dom";
import { games } from "../data/games";
import "../styles/Home.scss";

const Home = () => {
  document.title = "DEF Games";

  return (
    <div id="home-wrap">
      <header className="home-intro">
        <h1>Have some fun!</h1>
        <p>
          A sandbox for games I am studying, building, and sharing. It changes
          as new ideas land.
        </p>
      </header>

      <ul className="game-grid">
        {games.map((game) => (
          <li key={game.id}>
            <Link to={game.path} className="game-card">
              {game.isNew ? <span className="game-card-badge">New</span> : null}
              <img src={game.icon} alt="" />
              <h2>{game.name}</h2>
              <p>{game.description}</p>
              <span className="game-card-play">Play</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
