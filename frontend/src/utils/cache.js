// Simple in-memory cache store for instant, zero-delay page navigation
const dataCache = {
  products: null,
  orders: null,
  stats: null,
};

export const getCachedData = (key) => dataCache[key];

export const setCachedData = (key, data) => {
  dataCache[key] = data;
};
