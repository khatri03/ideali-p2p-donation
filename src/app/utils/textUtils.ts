/**
 * Strip HTML tags from a string to get plain text
 * Useful for character counting in rich text editors
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';

  // Create a temporary div element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Get text content without HTML tags
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Get character count from HTML content (excluding HTML tags)
 * @param html - HTML string
 * @returns Character count of plain text
 */
export const getTextLength = (html: string): number => {
  return stripHtmlTags(html).length;
};

/**
 * Truncate HTML content to a maximum character length (based on plain text)
 * @param html - HTML string
 * @param maxLength - Maximum character length
 * @returns Truncated plain text
 */
export const truncateHtmlToLength = (html: string, maxLength: number): string => {
  const plainText = stripHtmlTags(html);
  if (plainText.length <= maxLength) {
    return html;
  }
  return plainText.substring(0, maxLength);
};
