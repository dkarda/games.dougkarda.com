const ConcentrationCard = ({ card, handleChoice, flipped, disabled, cardBackImg, theme }) => {

    const handleCardClick = () => {
        if (!disabled) {
            handleChoice(card)
        }
    }

    return (
    <div className="concentration-card">
        <div className={flipped ? "flipped" : ""}>
            <img src={card.src} className="concentration-card-front" alt="card front" />
            <img 
                src={cardBackImg}
                className={`concentration-card-back ${theme}`}
                onClick={handleCardClick}
                alt="card back" />
        </div>
    </div>
    )
}

export default ConcentrationCard