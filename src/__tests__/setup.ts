import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.parent for embedded mode testing
Object.defineProperty(window, 'parent', {
  writable: true,
  value: window
});
