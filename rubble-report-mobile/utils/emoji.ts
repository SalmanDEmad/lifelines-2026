// Twemoji emoji utilities
import twemoji from 'twemoji';

/**
 * Render emoji with Twemoji for consistent Discord-style display
 * Returns SVG data URL for the emoji
 */
export const getTwemojiUrl = (emoji: string): string => {
  // Get the codepoint from the emoji
  const codePoint = twemoji.convert.toCodePoint(emoji);
  // Return Twemoji CDN URL (using the v14 version)
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@14/assets/svg/${codePoint}.svg`;
};

/**
 * Category emoji mappings with Twemoji support
 */
export const CATEGORY_EMOJIS = {
  rubble: '🧱',
  hazard: '⚠️',
  blocked_road: '🚧',
  default: '📍',
} as const;

/**
 * Get Twemoji URL for a category
 */
export const getCategoryEmojiUrl = (category: string): string => {
  const emoji = CATEGORY_EMOJIS[category as keyof typeof CATEGORY_EMOJIS] || CATEGORY_EMOJIS.default;
  return getTwemojiUrl(emoji);
};

/**
 * Region flag emoji to Twemoji URL
 */
export const getFlagEmojiUrl = (flag: string): string => {
  return getTwemojiUrl(flag);
};
