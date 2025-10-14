const ConcentrationCard = ({ card, handleChoice, flipped, disabled, cardImgBack }) => {

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
                src={cardImgBack}
                className="concentration-card-back"
                onClick={handleCardClick}
                alt="card back" />
        </div>
    </div>
    )
}

export default ConcentrationCard