import { Link } from 'react-router-dom'
import './ProductCard.css'
import { formatCurrency } from '../utils/currency'
import { useCart } from '../hooks/useCart'

function ProductCard({ product }) {
  const { getCartQuantity } = useCart()
  const remainingStock = Math.max(0, product.stock - getCartQuantity(product._id))

  return (
    <article className="product-card">
      <img className="product-image" src={product.imageURL} alt={product.name} />
      <div className="product-details">
        <p className="product-category">{product.category}</p>
        <h2>{product.name}</h2>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <strong>{formatCurrency(product.price)}</strong>
          <span>{remainingStock > 0 ? `${remainingStock} available` : 'Out of stock'}</span>
        </div>
        <Link className="view-details" to={`/products/${product._id}`}>View details</Link>
      </div>
    </article>
  )
}

export default ProductCard
