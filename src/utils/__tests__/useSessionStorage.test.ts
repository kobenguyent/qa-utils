import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSessionStorage, clearSessionStorage, clearAllSessionStorage } from '../useSessionStorage';

// Skip these tests if window is not defined (Node environment)
const describeOrSkip = typeof window !== 'undefined' ? describe : describe.skip;

describeOrSkip('useSessionStorage', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    window.sessionStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    window.sessionStorage.clear();
  });

  it('should initialize with initial value when no stored value exists', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'));
    
    expect(result.current[0]).toBe('initial-value');
  });

  it('should initialize with stored value when it exists', () => {
    window.sessionStorage.setItem('test-key', JSON.stringify('stored-value'));
    
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'));
    
    expect(result.current[0]).toBe('stored-value');
  });

  it('should update sessionStorage when value changes', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(result.current[0]).toBe('new-value');
    expect(window.sessionStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 10));
    
    act(() => {
      result.current[1](prev => prev + 5);
    });
    
    expect(result.current[0]).toBe(15);
    expect(window.sessionStorage.getItem('test-key')).toBe(JSON.stringify(15));
  });

  it('should handle complex objects', () => {
    const complexObject = { name: 'test', nested: { value: 42 } };
    const { result } = renderHook(() => useSessionStorage('test-key', complexObject));
    
    const updatedObject = { name: 'updated', nested: { value: 100 } };
    act(() => {
      result.current[1](updatedObject);
    });
    
    expect(result.current[0]).toEqual(updatedObject);
    expect(JSON.parse(window.sessionStorage.getItem('test-key') || '{}')).toEqual(updatedObject);
  });

  it('should handle arrays', () => {
    const initialArray = [1, 2, 3];
    const { result } = renderHook(() => useSessionStorage('test-key', initialArray));
    
    act(() => {
      result.current[1]([...initialArray, 4]);
    });
    
    expect(result.current[0]).toEqual([1, 2, 3, 4]);
  });

  it('should handle null and undefined', () => {
    const { result: result1 } = renderHook(() => useSessionStorage('test-key-1', null));
    const { result: result2 } = renderHook(() => useSessionStorage('test-key-2', undefined));
    
    expect(result1.current[0]).toBe(null);
    expect(result2.current[0]).toBe(undefined);
  });

  it('should handle errors gracefully when reading invalid JSON', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    window.sessionStorage.setItem('test-key', 'invalid-json{');
    
    const { result } = renderHook(() => useSessionStorage('test-key', 'fallback-value'));
    
    expect(result.current[0]).toBe('fallback-value');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should handle errors gracefully when writing to sessionStorage fails', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });
    
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    
    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should sync state when key changes', () => {
    window.sessionStorage.setItem('key-1', JSON.stringify('value-1'));
    window.sessionStorage.setItem('key-2', JSON.stringify('value-2'));
    
    const { result, rerender } = renderHook(
      ({ key }) => useSessionStorage(key, 'default'),
      { initialProps: { key: 'key-1' } }
    );
    
    expect(result.current[0]).toBe('value-1');
    
    rerender({ key: 'key-2' });
    
    expect(result.current[0]).toBe('value-2');
  });
});

describeOrSkip('clearSessionStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('should clear specific keys from sessionStorage', () => {
    window.sessionStorage.setItem('key1', 'value1');
    window.sessionStorage.setItem('key2', 'value2');
    window.sessionStorage.setItem('key3', 'value3');
    
    clearSessionStorage(['key1', 'key2']);
    
    expect(window.sessionStorage.getItem('key1')).toBe(null);
    expect(window.sessionStorage.getItem('key2')).toBe(null);
    expect(window.sessionStorage.getItem('key3')).toBe('value3');
  });

  it('should handle errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    clearSessionStorage(['key1']);
    
    expect(consoleSpy).toHaveBeenCalled();
    
    removeItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describeOrSkip('clearAllSessionStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('should clear all sessionStorage', () => {
    window.sessionStorage.setItem('key1', 'value1');
    window.sessionStorage.setItem('key2', 'value2');
    
    clearAllSessionStorage();
    
    expect(window.sessionStorage.length).toBe(0);
  });

  it('should handle errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const clearSpy = vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    clearAllSessionStorage();
    
    expect(consoleSpy).toHaveBeenCalled();
    
    clearSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
