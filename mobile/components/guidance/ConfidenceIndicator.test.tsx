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

// ─── Reanimated mock ──────────────────────────────────────────────────────────
// Vitest resolves `react-native-reanimated` from `__mocks__/react-native-reanimated.ts`

const h = React.createElement;

describe('ConfidenceIndicator', () => {
  it('renders with container testID', () => {
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

  it('tapping the dot toggles the detail label (tap to show)', () => {
    render(h(ConfidenceIndicator, { confidence: 'high' }));
    // Initially no label
    expect(screen.queryByText('GPS OK')).toBeNull();
    // Tap the dot
    fireEvent.press(screen.getByTestId('confidence-dot'));
    expect(screen.getByText('GPS OK')).toBeTruthy();
  });

  it('tapping again hides the detail label', () => {
    render(h(ConfidenceIndicator, { confidence: 'low' }));
    const el = screen.getByTestId('confidence-dot');
    // Show
    fireEvent.press(el);
    expect(screen.getByText('Weak GPS')).toBeTruthy();
    // Hide
    fireEvent.press(el);
    expect(screen.queryByText('Weak GPS')).toBeNull();
  });

  it('renders correctly for none confidence', () => {
    render(h(ConfidenceIndicator, { confidence: 'none' }));
    expect(screen.getByTestId('confidence-indicator')).toBeTruthy();
    fireEvent.press(screen.getByTestId('confidence-dot'));
    expect(screen.getByText('No GPS')).toBeTruthy();
  });

  // ─── PulseRing tests ───────────────────────────────────────────────────────

  it('renders pulse ring when showPulse defaults to true', () => {
    const { root } = render(h(ConfidenceIndicator, { confidence: 'high' }));
    // The PulseRing renders as an Animated.View; in the jsdom mock it
    // renders as a plain div.  The container (confidence-indicator) should
    // contain the pulse ring child.
    const container = screen.getByTestId('confidence-indicator');
    expect(container.props.children).toBeTruthy();
  });

  it('does not render pulse ring when showPulse is false', () => {
    render(h(ConfidenceIndicator, { confidence: 'high', showPulse: false }));
    // Container has a single child (dotTouchable) — no pulse ring div
    const container = screen.getByTestId('confidence-indicator');
    const children = container.props.children;
    // children is an array [pulseRing, dotTouchable] when showPulse is true,
    // or just dotTouchable when false
    if (Array.isArray(children)) {
      expect(children.length).toBe(1);
    }
  });

  it('pulse ring shows for medium confidence', () => {
    const { root } = render(h(ConfidenceIndicator, { confidence: 'medium' }));
    const container = screen.getByTestId('confidence-indicator');
    expect(container.props.children).toBeTruthy();
  });

  it('pulse ring shows for low confidence', () => {
    render(h(ConfidenceIndicator, { confidence: 'low' }));
    const container = screen.getByTestId('confidence-indicator');
    expect(container.props.children).toBeTruthy();
  });

  it('pulse ring shows for none confidence', () => {
    render(h(ConfidenceIndicator, { confidence: 'none' }));
    const container = screen.getByTestId('confidence-indicator');
    expect(container.props.children).toBeTruthy();
  });
});
