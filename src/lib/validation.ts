/**
 * Input validation and sanitization utilities
 */

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

// Prompt validation
export const validatePrompt = (prompt: string): ValidationResult => {
  if (!prompt || typeof prompt !== 'string') {
    return {
      isValid: false,
      error: 'Prompt must be a non-empty string',
    };
  }

  const trimmed = prompt.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Prompt cannot be empty',
    };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Prompt must be at least 3 characters long',
    };
  }

  if (trimmed.length > 1000) {
    return {
      isValid: false,
      error: 'Prompt cannot exceed 1000 characters',
    };
  }

  // Check for potentially harmful content
  const blockedPatterns = [
    /\b(script|javascript|vbscript|onload|onerror|onclick)\b/gi,
    /<[^>]*>/g, // HTML tags
    /[<>'"&]/g, // HTML special characters
  ];

  let sanitized = trimmed;

  // Remove HTML tags and special characters
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/[<>'"&]/g, '');

  // Check for blocked patterns
  for (const pattern of blockedPatterns) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        error: 'Prompt contains invalid characters or patterns',
      };
    }
  }

  // Additional content filtering
  const inappropriateWords: string[] = [
    // Add inappropriate words here if needed
    // This is a basic example - in production you'd want a more comprehensive list
  ];

  const lowerCasePrompt = sanitized.toLowerCase();
  for (const word of inappropriateWords) {
    if (lowerCasePrompt.includes(word.toLowerCase())) {
      return {
        isValid: false,
        error: 'Prompt contains inappropriate content',
      };
    }
  }

  return {
    isValid: true,
    sanitized,
  };
};

// Fingerprint validation
export const validateFingerprint = (fingerprint: string): ValidationResult => {
  if (!fingerprint || typeof fingerprint !== 'string') {
    return {
      isValid: false,
      error: 'Fingerprint must be a non-empty string',
    };
  }

  const trimmed = fingerprint.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Fingerprint cannot be empty',
    };
  }

  // Check if it's a valid hex string (8-64 characters)
  if (!/^[a-f0-9]{8,64}$/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid fingerprint format',
    };
  }

  return {
    isValid: true,
    sanitized: trimmed.toLowerCase(),
  };
};

// User UUID validation
export const validateUserUuid = (uuid: string): ValidationResult => {
  if (!uuid || typeof uuid !== 'string') {
    return {
      isValid: false,
      error: 'UUID must be a non-empty string',
    };
  }

  const trimmed = uuid.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'UUID cannot be empty',
    };
  }

  // Basic UUID format validation (flexible to support different UUID formats)
  if (!/^[a-f0-9-]{8,36}$/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid UUID format',
    };
  }

  return {
    isValid: true,
    sanitized: trimmed.toLowerCase(),
  };
};

// Rate limiting validation
export const validateRateLimit = (
  lastRequestTime: number,
  minInterval: number = 1000 // 1 second default
): ValidationResult => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < minInterval) {
    const remainingTime = Math.ceil((minInterval - timeSinceLastRequest) / 1000);
    return {
      isValid: false,
      error: `Please wait ${remainingTime} second(s) before making another request`,
    };
  }

  return {
    isValid: true,
  };
};

// General input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove HTML special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
};

// SQL injection prevention (basic)
export const preventSqlInjection = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // Remove SQL keywords
    .trim();
};

// XSS prevention
export const preventXss = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;');
};

// Comprehensive input validation and sanitization
export const validateAndSanitize = (
  input: string,
  type: 'prompt' | 'fingerprint' | 'uuid' | 'general'
): ValidationResult => {
  let result: ValidationResult;

  switch (type) {
    case 'prompt':
      result = validatePrompt(input);
      break;
    case 'fingerprint':
      result = validateFingerprint(input);
      break;
    case 'uuid':
      result = validateUserUuid(input);
      break;
    case 'general':
    default:
      result = {
        isValid: true,
        sanitized: sanitizeInput(input),
      };
      break;
  }

  // Apply additional sanitization if validation passed
  if (result.isValid && result.sanitized) {
    result.sanitized = preventXss(result.sanitized);
  }

  return result;
};

// Validation middleware for server actions
export const withValidation = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  validators: Array<(arg: any) => ValidationResult>
) => {
  return async (...args: T): Promise<R> => {
    // Validate all arguments
    for (let i = 0; i < validators.length && i < args.length; i++) {
      const validation = validators[i](args[i]);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.error}`);
      }

      // Replace argument with sanitized version if available
      if (validation.sanitized !== undefined) {
        (args as any)[i] = validation.sanitized;
      }
    }

    return await fn(...args);
  };
};