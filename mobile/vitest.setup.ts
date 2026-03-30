/**
 * Vitest setup file - runs before each test file.
 * Ensures React is available in the module scope for all tests.
 */
import React from 'react';

// Make React globally available for all test modules
// This is needed because some tests import React indirectly through hooks
// and the jsdom environment needs React to be properly initialized
globalThis.React = React;
