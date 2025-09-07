import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Make vi available globally
global.vi = vi

// Mock global variables that might be used in components
Object.defineProperty(global, '__COMMIT_HASH__', {
  value: 'test-hash',
  writable: true,
  configurable: true,
})