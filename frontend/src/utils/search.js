/**
 * Flipkart/Amazon-style E-Commerce Search & Relevance Engine
 * Features:
 * 1. Plural & Stem Normalization (phones -> phone, cleansers -> cleanser)
 * 2. Field-Weighted Scoring Matrix (Title > Brand/Tags > Category > Description)
 * 3. Exact Phrase & Sub-phrase Boosting
 * 4. Strict AND-Matching with Smart Fallback for Multi-word queries
 */

// Helper to normalize plurals and common suffixes (Flipkart Stemming)
function stemWord(word) {
  let w = word.toLowerCase().trim()
  if (w.length > 3) {
    if (w.endsWith('ies')) return w.slice(0, -3) + 'y'
    if (w.endsWith('es')) return w.slice(0, -2)
    if (w.endsWith('s')) return w.slice(0, -1)
    if (w.endsWith('ing')) return w.slice(0, -3)
  }
  return w
}

export function scoreAndSortProducts(products, query) {
  if (!query || !query.trim()) {
    return products
  }

  const rawQuery = query.toLowerCase().trim()
  // Remove special symbols for tokenizing
  const cleanQuery = rawQuery.replace(/[^a-z0-9\s]/gi, ' ')
  const rawTokens = cleanQuery.split(/\s+/).filter(Boolean)
  const stemmedTokens = rawTokens.map(stemWord)

  if (rawTokens.length === 0) return products

  const scoredProducts = products.map((product) => {
    const nameLower = (product.name || '').toLowerCase()
    const nameStemmed = nameLower.split(/\s+/).map(stemWord).join(' ')

    const descLower = (product.description || '').toLowerCase()
    const descStemmed = descLower.split(/\s+/).map(stemWord).join(' ')

    const categoryLower = (product.category || '').toLowerCase()
    const categoryStemmed = stemWord(categoryLower)

    const tagsLower = Array.isArray(product.tags)
      ? product.tags.map((t) => String(t).toLowerCase())
      : []
    const tagsStemmed = tagsLower.map(stemWord)
    const tagsJoined = tagsLower.join(' ')
    const tagsStemmedJoined = tagsStemmed.join(' ')

    let matchedTokensCount = 0
    let totalScore = 0

    // 1. EXACT TITLE MATCH (Flipkart Rank #1)
    if (nameLower === rawQuery || nameStemmed === cleanQuery) {
      totalScore += 150
    }

    // 2. TITLE STARTS WITH QUERY
    if (nameLower.startsWith(rawQuery) || nameStemmed.startsWith(cleanQuery)) {
      totalScore += 100
    }

    // 3. CONTIGUOUS PHRASE MATCH IN TITLE
    if (nameLower.includes(rawQuery) || nameStemmed.includes(cleanQuery)) {
      totalScore += 75
    }

    // 4. PHRASE MATCH IN TAGS / CATEGORY
    if (
      tagsJoined.includes(rawQuery) ||
      tagsStemmedJoined.includes(cleanQuery) ||
      categoryLower.includes(rawQuery) ||
      categoryStemmed.includes(cleanQuery)
    ) {
      totalScore += 50
    }

    // 5. PHRASE MATCH IN DESCRIPTION
    if (descLower.includes(rawQuery) || descStemmed.includes(cleanQuery)) {
      totalScore += 25
    }

    // 6. TOKEN-BY-TOKEN MATCHING
    rawTokens.forEach((token, idx) => {
      const stemmedToken = stemmedTokens[idx]
      let isTokenMatched = false

      // Title Token Match
      if (nameLower.includes(token) || nameStemmed.includes(stemmedToken)) {
        isTokenMatched = true
        totalScore += 20
      }

      // Tag Token Match
      if (
        tagsLower.some((t) => t.includes(token)) ||
        tagsStemmed.some((t) => t.includes(stemmedToken))
      ) {
        isTokenMatched = true
        totalScore += 15
      }

      // Category Token Match
      if (categoryLower.includes(token) || categoryStemmed.includes(stemmedToken)) {
        isTokenMatched = true
        totalScore += 12
      }

      // Description Token Match
      if (descLower.includes(token) || descStemmed.includes(stemmedToken)) {
        isTokenMatched = true
        totalScore += 5
      }

      if (isTokenMatched) {
        matchedTokensCount += 1
      }
    })

    return {
      product,
      matchedTokensCount,
      totalScore,
    }
  })

  // Filter items with at least 1 token match or positive score
  const matchingItems = scoredProducts.filter((item) => item.matchedTokensCount > 0 && item.totalScore > 0)

  if (matchingItems.length === 0) return []

  // Highest number of matched tokens among all items
  const maxMatched = Math.max(...matchingItems.map((item) => item.matchedTokensCount))

  // Flipkart Smart Precision Filter:
  // If multiple words searched (e.g., "iphone 256gb" or "skin care"), require products to match maximum tokens
  const filtered = rawTokens.length > 1
    ? matchingItems.filter((item) => item.matchedTokensCount === maxMatched)
    : matchingItems

  // Sort descending by relevance score
  return filtered
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((item) => item.product)
}
