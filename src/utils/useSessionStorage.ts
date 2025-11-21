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
    // Check if window is defined (SSR/Node environment compatibility)
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
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
      setStoredValue(prevState => {
        const valueToStore = value instanceof Function ? value(prevState) : value;
        
        // Save to sessionStorage inside a try-catch to handle errors
        // Check if window is defined (SSR/Node environment compatibility)
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (storageError) {
            console.warn(`Error setting sessionStorage key "${key}":`, storageError);
          }
        }
        
        return valueToStore;
      });
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key]);

  // Sync state with sessionStorage when key changes
  useEffect(() => {
    // Check if window is defined (SSR/Node environment compatibility)
    if (typeof window === 'undefined') {
      return;
    }
    
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
  // Check if window is defined (SSR/Node environment compatibility)
  if (typeof window === 'undefined') {
    return;
  }
  
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
  // Check if window is defined (SSR/Node environment compatibility)
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    window.sessionStorage.clear();
  } catch (error) {
    console.warn('Error clearing all sessionStorage:', error);
  }
}
