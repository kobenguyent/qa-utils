export const sanitizeHtml = (html: string): string => {
  // Basic XSS protection - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
};

export const validateHtml = (html: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!html.trim()) {
    errors.push('HTML code is empty');
    return { valid: false, errors };
  }

  // Check for unclosed tags (excluding self-closing tags)
  const openTags = html.match(/<(\w+)(?:\s[^>]*)?(?<!\/)>/g) || [];
  const closeTags = html.match(/<\/(\w+)>/g) || [];
  
  if (openTags.length !== closeTags.length) {
    errors.push('Mismatched opening and closing tags');
  }

  return { valid: errors.length === 0, errors };
};
