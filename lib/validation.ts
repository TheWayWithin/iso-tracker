/**
 * Input validation utilities
 * Provides HTML sanitization, URL validation, and content filtering
 */

/**
 * Sanitize HTML input to prevent XSS attacks
 * Strips all HTML tags and returns plain text
 */
export function sanitizeHtml(input: string): string {
  // Remove all HTML tags
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Basic profanity filter
 * Returns true if content contains inappropriate language
 */
const PROFANITY_LIST = [
  // Add profanity words here as needed
  // This is a basic implementation - production should use a more comprehensive solution
];

export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => lowerText.includes(word));
}

/**
 * Validate evidence submission data
 */
export function validateEvidenceSubmission(data: {
  title: string;
  description: string;
  methodology: string;
  source_url?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Title validation
  if (data.title.length < 3 || data.title.length > 200) {
    errors.push('Title must be between 3 and 200 characters');
  }
  if (containsProfanity(data.title)) {
    errors.push('Title contains inappropriate language');
  }

  // Description validation
  if (data.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  if (containsProfanity(data.description)) {
    errors.push('Description contains inappropriate language');
  }

  // Methodology validation
  if (data.methodology.length < 10) {
    errors.push('Methodology must be at least 10 characters');
  }

  // URL validation (if provided)
  if (data.source_url && !isValidUrl(data.source_url)) {
    errors.push('Invalid URL format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize evidence submission data
 */
export function sanitizeEvidenceSubmission(data: {
  title: string;
  description: string;
  methodology: string;
  source_url?: string;
}) {
  return {
    title: sanitizeHtml(data.title).trim(),
    description: sanitizeHtml(data.description).trim(),
    methodology: sanitizeHtml(data.methodology).trim(),
    source_url: data.source_url?.trim() || undefined,
  };
}
