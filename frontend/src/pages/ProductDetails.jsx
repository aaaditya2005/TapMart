import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduct } from '../services/api'
import { createProductReview } from '../services/api'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency } from '../utils/currency'
import './ProductDetails.css'

function ProductDetails() {
  const { productId } = useParams()
  const { addToCart, getCartQuantity, updateQuantity, removeFromCart } = useCart()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    let isCurrent = true

    getProduct(productId)
      .then((data) => {
        if (isCurrent) setProduct(data)
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message)
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [productId])

  if (loading) return <main className="product-details-page"><p className="product-details-message">Loading product...</p></main>
  if (error || !product) return <main className="product-details-page"><p className="product-details-message product-details-error">{error || 'Product not found.'}</p></main>

  const cartQuantity = getCartQuantity(product._id)
  const remainingStock = Math.max(0, product.stock - cartQuantity)
  const isAdded = cartQuantity > 0

  const handleAdd = () => {
    addToCart(product)
  }

  const handleReviewSubmit = async (event) => {
    event.preventDefault()
    setReviewError('')
    setReviewMessage('')
    setReviewLoading(true)
    try {
      const updatedProduct = await createProductReview(product._id, reviewRating, reviewComment)
      setProduct(updatedProduct)
      setReviewComment('')
      setReviewMessage('Your review was added.')
    } catch (requestError) {
      setReviewError(requestError.message)
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <main className="product-details-page">
      <Link className="back-link" to="/products">Back to products</Link>
      <section className="product-details-layout">
        <img className="product-details-image" src={product.imageURL} alt={product.name} />
        <div className="product-details-content">
          <p className="product-category">{product.category}</p>
          <h1>{product.name}</h1>
          <div className="product-rating" aria-label={`${product.rating} out of 5 stars`}>
            <span>{'★'.repeat(Math.round(product.rating || 0))}{'☆'.repeat(5 - Math.round(product.rating || 0))}</span>
            <span>{Number(product.rating || 0).toFixed(1)} ({product.numReviews || 0} reviews)</span>
          </div>
          <p className="product-details-price">{formatCurrency(product.price)}</p>
          <p className="product-long-description">{product.description}</p>
          <p className="product-stock">{remainingStock > 0 ? `${remainingStock} available` : 'Out of stock'}</p>
          {!isAdded ? (
            <button className="details-add-button" type="button" disabled={remainingStock === 0} onClick={handleAdd}>
              {remainingStock > 0 ? 'Add to cart' : 'Out of stock'}
            </button>
          ) : (
            <div className="details-cart-actions">
              <div className="details-quantity">
                <button type="button" onClick={() => cartQuantity === 1 ? removeFromCart(product._id) : updateQuantity(product._id, cartQuantity - 1)} aria-label="Decrease quantity">-</button>
                <span>{cartQuantity}</span>
                <button type="button" onClick={() => updateQuantity(product._id, cartQuantity + 1)} disabled={remainingStock === 0} aria-label="Increase quantity">+</button>
              </div>
            </div>
          )}
          {isAdded && <p className="added-message">{cartQuantity} already in your cart.</p>}
        </div>
      </section>
      <section className="reviews-section" aria-labelledby="reviews-title">
        <h2 id="reviews-title">Customer reviews</h2>
        <p className="reviews-summary">{product.numReviews || 0} reviews</p>
        {(product.reviews || []).length === 0 ? (
          <p className="no-reviews">No reviews yet.</p>
        ) : (
          <div className="reviews-list">
            {product.reviews.map((review) => (
              <article className="review-item" key={review._id}>
                <div className="review-heading">
                  <strong>{review.name}</strong>
                  <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        )}
        {user ? (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <h3>Share your experience</h3>
            <label>Rating<select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Very poor</option></select></label>
            <label>Review<textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength="500" required /></label>
            {reviewError && <p className="review-error" role="alert">{reviewError}</p>}
            {reviewMessage && <p className="review-message" role="status">{reviewMessage}</p>}
            <button type="submit" disabled={reviewLoading}>{reviewLoading ? 'Submitting...' : 'Submit review'}</button>
            <small>You can review after your order has been delivered. One review is allowed per product.</small>
          </form>
        ) : (
          <p className="review-login-message">Log in after delivery to write a review.</p>
        )}
      </section>
    </main>
  )
}

export default ProductDetails
