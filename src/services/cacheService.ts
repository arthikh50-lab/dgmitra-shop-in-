const CACHE_KEY_PREFIX = 'meku_cache_';

export const setCache = (key: string, data: any, ttlMinutes: number = 5) => {
  const expiry = Date.now() + ttlMinutes * 60 * 1000;
  const cacheData = {
    data,
    expiry
  };
  localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheData));
};

export const getCache = (key: string) => {
  const item = localStorage.getItem(CACHE_KEY_PREFIX + key);
  if (!item) return null;

  try {
    const { data, expiry } = JSON.parse(item);
    if (Date.now() > expiry) {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }
    return data;
  } catch (e) {
    console.error('Error parsing cache:', e);
    return null;
  }
};

export const clearCache = (key?: string) => {
  if (key) {
    localStorage.removeItem(CACHE_KEY_PREFIX + key);
  } else {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  }
};
