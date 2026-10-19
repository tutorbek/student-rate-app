import { normalizeIconUrl, AVATAR_GALLERY_IMAGES, isGalleryImage } from './avatarGallery';

// In-memory cache of fully loaded & decoded image URLs
const loadedAvatarUrls = new Set();
const ongoingPreloadPromises = new Map();

/**
 * Check whether a given avatar key or image URL is already loaded and ready in memory.
 */
export const isAvatarLoaded = (keyOrUrl) => {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') return true;
  const normalized = normalizeIconUrl(keyOrUrl);
  if (!normalized) return true;
  // SVGs and emojis don't need image network preloading
  if (!isGalleryImage(normalized) && !normalized.startsWith('http') && !normalized.startsWith('data:image') && !normalized.includes('/')) {
    return true;
  }
  return loadedAvatarUrls.has(normalized);
};

/**
 * Mark a URL as loaded in memory
 */
export const markAvatarLoaded = (keyOrUrl) => {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') return;
  const normalized = normalizeIconUrl(keyOrUrl);
  if (normalized) {
    loadedAvatarUrls.add(normalized);
  }
};

/**
 * Preload a single avatar image into browser memory cache.
 * Returns a Promise that resolves when the image is decoded and ready.
 */
export const preloadAvatar = (keyOrUrl) => {
  if (typeof window === 'undefined' || !keyOrUrl || typeof keyOrUrl !== 'string') {
    return Promise.resolve();
  }

  const normalized = normalizeIconUrl(keyOrUrl);
  if (!normalized) return Promise.resolve();

  // If not a network image (e.g. SVG id or base64), it's already instant
  if (!isGalleryImage(normalized) && !normalized.startsWith('http') && !normalized.startsWith('data:image') && !normalized.includes('/')) {
    return Promise.resolve();
  }

  if (loadedAvatarUrls.has(normalized)) {
    return Promise.resolve();
  }

  if (ongoingPreloadPromises.has(normalized)) {
    return ongoingPreloadPromises.get(normalized);
  }

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';

    img.onload = () => {
      loadedAvatarUrls.add(normalized);
      ongoingPreloadPromises.delete(normalized);
      resolve(normalized);
    };

    img.onerror = () => {
      // Find fallback if gallery image
      const galleryMatch = AVATAR_GALLERY_IMAGES.find((g) => g.path === normalized || (g.name && normalized.includes(g.name)));
      if (galleryMatch?.cdnPath && galleryMatch.cdnPath !== normalized) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          loadedAvatarUrls.add(galleryMatch.cdnPath);
          ongoingPreloadPromises.delete(normalized);
          resolve(galleryMatch.cdnPath);
        };
        fallbackImg.onerror = () => {
          ongoingPreloadPromises.delete(normalized);
          resolve(null);
        };
        fallbackImg.src = galleryMatch.cdnPath;
      } else {
        ongoingPreloadPromises.delete(normalized);
        resolve(null);
      }
    };

    img.src = normalized;
  });

  ongoingPreloadPromises.set(normalized, promise);
  return promise;
};

/**
 * Preload an array of avatar keys / URLs in parallel.
 */
export const preloadAvatars = (keysOrUrls = []) => {
  if (!Array.isArray(keysOrUrls) || keysOrUrls.length === 0) return Promise.resolve([]);
  const validList = keysOrUrls.filter(Boolean);
  return Promise.all(validList.map((key) => preloadAvatar(key)));
};

/**
 * Idle background preloading for the full gallery.
 * Runs in chunks during browser idle periods so it never blocks UI or main thread.
 */
let hasStartedIdlePreload = false;
export const idlePreloadGalleryAvatars = () => {
  if (typeof window === 'undefined' || hasStartedIdlePreload) return;
  hasStartedIdlePreload = true;

  const queue = AVATAR_GALLERY_IMAGES.map((img) => img.path);
  const CHUNK_SIZE = 4;
  const CHUNK_DELAY = 120;

  const processNextChunk = () => {
    if (queue.length === 0) return;
    const chunk = queue.splice(0, CHUNK_SIZE);
    chunk.forEach((path) => preloadAvatar(path));

    if (queue.length > 0) {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => setTimeout(processNextChunk, CHUNK_DELAY));
      } else {
        setTimeout(processNextChunk, CHUNK_DELAY);
      }
    }
  };

  // Start after initial page interaction / mount
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => setTimeout(processNextChunk, 800));
  } else {
    setTimeout(processNextChunk, 1000);
  }
};
