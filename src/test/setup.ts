import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Make vi available globally
(globalThis as typeof globalThis & { vi: typeof vi }).vi = vi

// Mock global variables that might be used in components
Object.defineProperty(globalThis, '__COMMIT_HASH__', {
  value: 'test-hash',
  writable: true,
  configurable: true,
})

// Mock sessionStorage and localStorage
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

// Create single instances
const sessionStorageMock = createStorageMock()
const localStorageMock = createStorageMock()

// Set on global (for Node.js compatibility)
if (typeof global !== 'undefined') {
  // @ts-ignore
  global.sessionStorage = sessionStorageMock
  // @ts-ignore
  global.localStorage = localStorageMock
}

// Set on globalThis
Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// Ensure document is available for React Testing Library
if (typeof document === 'undefined') {
  // @ts-ignore
  global.document = {
    body: {},
    createElement: () => ({}),
    createTextNode: () => ({}),
  }
}