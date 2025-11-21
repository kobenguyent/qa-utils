import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing state with sessionStorage persistence
 * @param key - The key to use in sessionStorage
 * @param initialValue - The initial value if no stored value exists
 * @returns A tuple containing the state value and a setter function
 */
export function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial state from sessionStorage or use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update sessionStorage when state changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      // Save to sessionStorage
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Sync state with sessionStorage when key changes
  useEffect(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error syncing sessionStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Clears specific keys from sessionStorage
 * @param keys - Array of keys to clear
 */
export function clearSessionStorage(keys: string[]): void {
  try {
    keys.forEach(key => {
      window.sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Error clearing sessionStorage:', error);
  }
}

/**
 * Clears all sessionStorage (use with caution)
 */
export function clearAllSessionStorage(): void {
  try {
    window.sessionStorage.clear();
  } catch (error) {
    console.warn('Error clearing all sessionStorage:', error);
  }
}
