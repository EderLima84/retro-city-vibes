import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Property-based testing configuration
    testTimeout: 30000, // Increased timeout for property tests with many iterations
    hookTimeout: 30000,
  },
});
