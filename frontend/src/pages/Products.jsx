import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { scoreAndSortProducts } from '../utils/search'
import { useStore } from '../context/StoreContext'
import './Products.css'

const Products = () => {
  const { products, isProductsLoaded, fetchProducts } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const searchQuery = searchParams.get('search') || ''
  const selectedCategory = searchParams.get('category') || 'All'

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearchChange = (e) => {
    const value = e.target.value
    const newParams = new URLSearchParams(searchParams)
    if (value.trim()) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleCategorySelect = (category) => {
    const newParams = new URLSearchParams(searchParams)
    if (category && category !== 'All') {
      newParams.set('category', category)
    } else {
      newParams.delete('category')
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleClearSearch = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('search')
    setSearchParams(newParams, { replace: true })
  }

  // 1. Filter by category if selected
  const categoryFiltered = selectedCategory === 'All'
    ? products
    : products.filter((p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase())

  // 2. Score and sort by keyword relevance (most matching keywords top to bottom)
  const filteredProducts = scoreAndSortProducts(categoryFiltered, searchQuery)

  // Extract unique categories for filter pills
  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))]

  return (
    <main className="products-page">
      <div className="products-heading">
        <div>
          <p className="eyebrow">TapMart Shop</p>
          <h1>All Products</h1>
        </div>
        {isProductsLoaded && (
          <p className="product-count-badge">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
          </p>
        )}
      </div>

      {/* Search & Filter Controls */}
      <section className="search-filter-section" aria-label="Search and filter products">
        <div className="search-bar-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="product-search-input"
            placeholder="Search by keywords (e.g. iphone 17 256gb, wireless headphones, shoes)..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search products by keywords"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClearSearch}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="category-pills" aria-label="Product categories">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </section>

      {!isProductsLoaded && (
        <section className="products-grid" aria-label="Loading products">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="product-skeleton-card" key={i}>
              <div className="skeleton-img"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-text title"></div>
              <div className="skeleton-text desc"></div>
              <div className="skeleton-footer"></div>
            </div>
          ))}
        </section>
      )}

      {isProductsLoaded && filteredProducts.length === 0 && (
        <div className="no-products-container">
          <p className="products-message">
            No products match your search criteria {searchQuery && <span>for "<strong>{searchQuery}</strong>"</span>}.
          </p>
          {searchQuery && (
            <button type="button" className="primary-button" onClick={handleClearSearch}>
              View All Products
            </button>
          )}
        </div>
      )}

      {filteredProducts.length > 0 && (
        <section className="products-grid" aria-label="Product search results">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </section>
      )}
    </main>
  )
}

export default Products
