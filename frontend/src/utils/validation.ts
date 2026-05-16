/**
 * Validation utilities for forms and inputs
 */

export const validation = {
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  password: (value: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (value.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(value)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(value)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(value)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },

  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  githubUrl: (value: string): boolean => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(value);
  },

  required: (value: string | number | boolean | null | undefined): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  },

  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  pattern: (value: string, pattern: RegExp): boolean => {
    return pattern.test(value);
  },
};

/**
 * Form validation helper
 */
export function validateForm<T extends Record<string, any>>(
  values: T,
  rules: Partial<Record<keyof T, (value: any) => string | undefined>>
): { valid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const key in rules) {
    const rule = rules[key];
    if (rule) {
      const error = rule(values[key]);
      if (error) {
        errors[key] = error;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Made with Bob
