const fs = require('fs');
const path = require('path');
const GooglePhotosAlbum = require('google-photos-album-image-url-fetch');

const SLIDESHOW_CACHE_PATH = path.join(__dirname, '/data/slideshow_cache.json');

// Fetch images from a Google Photos album URL and cache them locally
const updateSlideshowCache = async (albumUrl) => {
  try {
    const images = await GooglePhotosAlbum.fetchImageUrls(albumUrl);
    const imageUrls = images.map(image => image.url);

    // Store image URLs in cache file along with albumUrl and timestamp
    const payload = {
      albumUrl: albumUrl || '',
      urls: imageUrls,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(SLIDESHOW_CACHE_PATH, JSON.stringify(payload, null, 2), 'utf8');
    return payload;
  } catch (error) {
    console.error('Error updating slideshow cache:', error.message);
    throw error;
  }
};

// Get cached slideshow images. If albumUrl is provided and the cache is
// older than 24 hours or for a different album, refresh the cache first.
const getSlideshowImages = async (albumUrl) => {
  try {
    let cache = { urls: [], albumUrl: '', updatedAt: null };
    if (fs.existsSync(SLIDESHOW_CACHE_PATH)) {
      try {
        cache = JSON.parse(fs.readFileSync(SLIDESHOW_CACHE_PATH, 'utf8'));
      } catch (e) {
        // ignore and treat as empty cache
        cache = { urls: [], albumUrl: '', updatedAt: null };
      }
    }

    const needsRefresh = (() => {
      if (!albumUrl) return false; // nothing to refresh for empty URL
      if (!cache.updatedAt) return true; // never updated
      if (cache.albumUrl !== albumUrl) return true; // different album
      const updatedAt = new Date(cache.updatedAt).getTime();
      const ageMs = Date.now() - updatedAt;
      return ageMs > 24 * 60 * 60 * 1000; // older than 24 hours
    })();

    if (needsRefresh) {
      try {
        cache = await updateSlideshowCache(albumUrl);
      } catch (e) {
        // If refresh fails, fall back to whatever cache we have (could be empty)
        console.error('Failed to refresh slideshow cache, returning stale cache if available.');
      }
    }

    // Ensure we always return an object with urls
    return { urls: (cache && cache.urls) || [] };
  } catch (error) {
    console.error('Error reading slideshow cache:', error.message);
    return { urls: [] };
  }
};

module.exports = {
  updateSlideshowCache,
  getSlideshowImages
};
