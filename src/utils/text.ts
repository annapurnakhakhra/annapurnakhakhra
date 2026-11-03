/**
 * Utilities for cleaning and formatting text and HTML content
 */

/**
 * Strip HTML tags, embedded styles/scripts, and decode common entities to return clean readable plain text.
 */
export function stripHtml(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // remove inline style blocks
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // remove script blocks
    .replace(/<[^>]+>/g, ' ') // remove all HTML tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if string contains HTML markup tags
 */
export function hasHtml(str?: string | null): boolean {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}
