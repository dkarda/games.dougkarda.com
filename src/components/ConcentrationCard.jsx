const ConcentrationCard = ({
  card,
  handleChoice,
  flipped,
  disabled,
  cardBackImg,
  theme,
}) => {
  const handleCardClick = () => {
    if (!disabled && !flipped) {
      handleChoice(card);
    }
  };

  return (
    <button
      type="button"
      className={`concentration-card ${flipped ? "is-flipped" : ""} ${card.matched ? "is-matched" : ""}`}
      onClick={handleCardClick}
      disabled={disabled || flipped}
      aria-label={flipped ? "Face-up card" : "Face-down card"}
    >
      <span className={flipped ? "flipped" : ""}>
        <img
          src={card.src}
          className="concentration-card-front"
          alt=""
        />
        <img
          src={cardBackImg}
          className={`concentration-card-back ${theme}`}
          alt=""
        />
      </span>
    </button>
  );
};

export default ConcentrationCard;
