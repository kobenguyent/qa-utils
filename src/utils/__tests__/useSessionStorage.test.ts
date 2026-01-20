import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { useSessionStorage, clearSessionStorage, clearAllSessionStorage } from '../useSessionStorage';

// Setup storage mocks before all tests
beforeAll(() => {
  const createStorageMock = () => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { store = {} },
      get length() { return Object.keys(store).length },
      key: (index: number) => Object.keys(store)[index] || null,
    }
  }

  const sessionStorageMock = createStorageMock()
  
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  })
})

describe('useSessionStorage', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    globalThis.sessionStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    globalThis.sessionStorage.clear();
  });

  it('should initialize with initial value when no stored value exists', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'));
    
    expect(result.current[0]).toBe('initial-value');
  });

  it('should initialize with stored value when it exists', () => {
    globalThis.sessionStorage.setItem('test-key', JSON.stringify('stored-value'));
    
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'));
    
    expect(result.current[0]).toBe('stored-value');
  });

  it('should update sessionStorage when value changes', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(result.current[0]).toBe('new-value');
    expect(globalThis.sessionStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 10));
    
    act(() => {
      result.current[1](prev => prev + 5);
    });
    
    expect(result.current[0]).toBe(15);
    expect(globalThis.sessionStorage.getItem('test-key')).toBe(JSON.stringify(15));
  });

  it('should handle complex objects', () => {
    const complexObject = { name: 'test', nested: { value: 42 } };
    const { result } = renderHook(() => useSessionStorage('test-key', complexObject));
    
    const updatedObject = { name: 'updated', nested: { value: 100 } };
    act(() => {
      result.current[1](updatedObject);
    });
    
    expect(result.current[0]).toEqual(updatedObject);
    expect(JSON.parse(globalThis.sessionStorage.getItem('test-key') || '{}')).toEqual(updatedObject);
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
    globalThis.sessionStorage.setItem('test-key', 'invalid-json{');
    
    const { result } = renderHook(() => useSessionStorage('test-key', 'fallback-value'));
    
    expect(result.current[0]).toBe('fallback-value');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should handle errors gracefully when writing to sessionStorage fails', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const setItemSpy = vi.spyOn(globalThis.sessionStorage, 'setItem').mockImplementation(() => {
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
    globalThis.sessionStorage.setItem('key-1', JSON.stringify('value-1'));
    globalThis.sessionStorage.setItem('key-2', JSON.stringify('value-2'));
    
    const { result, rerender } = renderHook(
      ({ key }) => useSessionStorage(key, 'default'),
      { initialProps: { key: 'key-1' } }
    );
    
    expect(result.current[0]).toBe('value-1');
    
    rerender({ key: 'key-2' });
    
    expect(result.current[0]).toBe('value-2');
  });
});

describe('clearSessionStorage', () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
  });

  it('should clear specific keys from sessionStorage', () => {
    globalThis.sessionStorage.setItem('key1', 'value1');
    globalThis.sessionStorage.setItem('key2', 'value2');
    globalThis.sessionStorage.setItem('key3', 'value3');
    
    clearSessionStorage(['key1', 'key2']);
    
    expect(globalThis.sessionStorage.getItem('key1')).toBe(null);
    expect(globalThis.sessionStorage.getItem('key2')).toBe(null);
    expect(globalThis.sessionStorage.getItem('key3')).toBe('value3');
  });

  it('should handle errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const removeItemSpy = vi.spyOn(globalThis.sessionStorage, 'removeItem').mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    clearSessionStorage(['key1']);
    
    expect(consoleSpy).toHaveBeenCalled();
    
    removeItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe('clearAllSessionStorage', () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
  });

  it('should clear all sessionStorage', () => {
    globalThis.sessionStorage.setItem('key1', 'value1');
    globalThis.sessionStorage.setItem('key2', 'value2');
    
    clearAllSessionStorage();
    
    expect(globalThis.sessionStorage.length).toBe(0);
  });

  it('should handle errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const clearSpy = vi.spyOn(globalThis.sessionStorage, 'clear').mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    clearAllSessionStorage();
    
    expect(consoleSpy).toHaveBeenCalled();
    
    clearSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
