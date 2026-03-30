/**
 * Tests for ConfidenceIndicator component.
 * Written as .test.tsx but uses React.createElement to avoid Vite 7's
 * TSX transform issue (oxc can't parse TypeScript `import type` syntax).
 * @testing-library/react-native is used via @testing-library/react-native/build.
 */

import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ConfidenceIndicator } from './ConfidenceIndicator';

const h = React.createElement;

describe('ConfidenceIndicator', () => {
  it('renders with testID', () => {
    render(h(ConfidenceIndicator, { confidence: 'high' }));
    expect(screen.getByTestId('confidence-indicator')).toBeTruthy();
  });

  it('has Pressable accessibility role', () => {
    render(h(ConfidenceIndicator, { confidence: 'medium' }));
    const el = screen.getByTestId('confidence-indicator');
    expect(el.props.accessibilityRole).toBe('button');
  });

  it('shows accessibility label with confidence level', () => {
    render(h(ConfidenceIndicator, { confidence: 'low' }));
    const el = screen.getByTestId('confidence-indicator');
    expect(el.props.accessibilityLabel).toBe('GPS confidence: low');
  });

  it('tapping toggles the detail label (tap to show)', () => {
    render(h(ConfidenceIndicator, { confidence: 'high' }));
    // Initially no label
    expect(screen.queryByText('GPS OK')).toBeNull();
    // Tap
    fireEvent.press(screen.getByTestId('confidence-indicator'));
    expect(screen.getByText('GPS OK')).toBeTruthy();
  });

  it('tapping again hides the detail label', () => {
    render(h(ConfidenceIndicator, { confidence: 'low' }));
    const el = screen.getByTestId('confidence-indicator');
    // Show
    fireEvent.press(el);
    expect(screen.getByText('Weak GPS')).toBeTruthy();
    // Hide
    fireEvent.press(el);
    expect(screen.queryByText('Weak GPS')).toBeNull();
  });

  it('renders correctly for none confidence', () => {
    render(h(ConfidenceIndicator, { confidence: 'none' }));
    const el = screen.getByTestId('confidence-indicator');
    expect(el).toBeTruthy();
    fireEvent.press(el);
    expect(screen.getByText('No GPS')).toBeTruthy();
  });
});
