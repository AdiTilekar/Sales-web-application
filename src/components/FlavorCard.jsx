const FlavorCard = ({ product, selected, onSelect }) => {
  return (
    <button
      type="button"
      className={`glass-card flavor-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(product.id)}
    >
      <div className="flavor-visual">
        <div className="flavor-halo" />
        <img src={product.image} alt={product.name} className="flavor-image" loading="lazy" />
        <span className="price-tag">₹{product.price}</span>
      </div>

      <div className="flavor-copy">
        <p className="flavor-name">{product.name}</p>
        <span className="flavor-hint">Tap to add sale</span>
      </div>
    </button>
  )
}

export default FlavorCard
