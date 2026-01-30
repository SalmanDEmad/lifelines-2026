// Twemoji emoji utilities for web
import twemoji from 'twemoji';

/**
 * Render emoji with Twemoji for consistent Discord-style display
 * Returns SVG data URL for the emoji
 */
export const getTwemojiUrl = (emoji) => {
  // Get the codepoint from the emoji
  const codePoint = twemoji.convert.toCodePoint(emoji);
  // Return Twemoji CDN URL (using the v14 version)
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@14/assets/svg/${codePoint}.svg`;
};

/**
 * Parse HTML string with Twemoji
 * Converts emoji in a string to Twemoji SVG images
 */
export const renderTwemoji = (text) => {
  return twemoji.parse(text, {
    folder: 'svg',
    ext: '.svg',
    base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@14/assets/'
  });
};

/**
 * Category emoji mappings with Twemoji support
 */
export const CATEGORY_EMOJIS = {
  rubble: '🧱',
  hazard: '⚠️',
  blocked_road: '🚧',
  default: '📍',
};

/**
 * Voting emoji mappings with Twemoji support
 */
export const VOTE_EMOJIS = {
  accurate: '✅',
  inaccurate: '❌',
  unclear: '❓',
};

/**
 * Get Twemoji URL for a category
 */
export const getCategoryEmojiUrl = (category) => {
  const emoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.default;
  return getTwemojiUrl(emoji);
};

/**
 * Get Twemoji SVG component as React-compatible HTML
 */
export const getTwemojiHtml = (emoji) => {
  const url = getTwemojiUrl(emoji);
  return `<img src="${url}" alt="${emoji}" style="width: 1em; height: 1em; vertical-align: -0.125em; margin: 0 0.05em;" />`;
};

/**
 * React component version - returns the image tag string for innerHTML
 */
export const TwemojiImg = (emoji) => {
  const url = getTwemojiUrl(emoji);
  return url;
};
