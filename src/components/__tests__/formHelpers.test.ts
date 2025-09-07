import { describe, it, expect } from 'vitest';

describe('Form Validation Helpers', () => {
  it('should validate textarea input length', () => {
    const validateTextarea = (text: string, maxLength = 5000) => {
      return {
        isValid: text.length <= maxLength,
        length: text.length,
        remaining: maxLength - text.length
      };
    };

    const shortText = 'Hello';
    const result = validateTextarea(shortText);
    expect(result.isValid).toBe(true);
    expect(result.length).toBe(5);
    expect(result.remaining).toBe(4995);

    const longText = 'x'.repeat(6000);
    const longResult = validateTextarea(longText);
    expect(longResult.isValid).toBe(false);
    expect(longResult.remaining).toBe(-1000);
  });

  it('should handle copy button state management', () => {
    const getCopyButtonState = (text: string, isLoading = false) => {
      return {
        disabled: !text.trim() || isLoading,
        text: isLoading ? 'Copying...' : 'Copy to clipboard',
        variant: text.trim() ? 'primary' : 'secondary'
      };
    };

    expect(getCopyButtonState('')).toEqual({
      disabled: true,
      text: 'Copy to clipboard',
      variant: 'secondary'
    });

    expect(getCopyButtonState('test')).toEqual({
      disabled: false,
      text: 'Copy to clipboard',
      variant: 'primary'
    });

    expect(getCopyButtonState('test', true)).toEqual({
      disabled: true,
      text: 'Copying...',
      variant: 'primary'
    });
  });

  it('should format error messages consistently', () => {
    const formatErrorMessage = (error: string | Error) => {
      if (typeof error === 'string') return error;
      return error.message || 'An unexpected error occurred';
    };

    expect(formatErrorMessage('Simple error')).toBe('Simple error');
    expect(formatErrorMessage(new Error('Test error'))).toBe('Test error');
    expect(formatErrorMessage(new Error())).toBe('An unexpected error occurred');
  });

  it('should handle clipboard API availability check', () => {
    const isClipboardAvailable = () => {
      const hasNavigator = typeof navigator !== 'undefined';
      const hasClipboard = hasNavigator && navigator.clipboard;
      const hasReadText = hasClipboard && typeof navigator.clipboard.readText === 'function';
      return Boolean(hasNavigator && hasClipboard && hasReadText);
    };

    // In Node.js environment, clipboard should not be available
    const result = isClipboardAvailable();
    expect(typeof result).toBe('boolean');
    expect(result).toBe(false);
  });

  it('should validate Bootstrap variant classes', () => {
    const getAlertVariant = (type: 'success' | 'error' | 'warning' | 'info') => {
      const variants = {
        success: 'success',
        error: 'danger',
        warning: 'warning',
        info: 'info'
      };
      return variants[type] || 'secondary';
    };

    expect(getAlertVariant('success')).toBe('success');
    expect(getAlertVariant('error')).toBe('danger');
    expect(getAlertVariant('warning')).toBe('warning');
    expect(getAlertVariant('info')).toBe('info');
  });
});