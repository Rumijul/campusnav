import type { PathResult } from '@shared/pathfinding/types'
import type { NavNode } from '@shared/types'
import { useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import type { DirectionStep, DirectionsResult, StepIcon } from '../hooks/useRouteDirections'

// ============================================================
// Props
// ============================================================

export interface DirectionsSheetProps {
  open: boolean
  standard: PathResult | null
  accessible: PathResult | null
  standardDirections: DirectionsResult
  accessibleDirections: DirectionsResult
  routesIdentical: boolean
  activeMode: 'standard' | 'accessible'
  onTabChange: (mode: 'standard' | 'accessible') => void
  onBack: () => void
  startNode: NavNode | null
  destNode: NavNode | null
}

// ============================================================
// Helpers
// ============================================================

function formatDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`
  const mins = Math.round(sec / 60)
  return `${mins} min`
}

// ============================================================
// Sub-components
// ============================================================

interface TabButtonProps {
  mode: 'standard' | 'accessible'
  activeMode: 'standard' | 'accessible'
  found: boolean
  color: string
  label: string
  onTabChange: (mode: 'standard' | 'accessible') => void
  disabledTitle?: string
}

function TabButton({
  mode,
  activeMode,
  found,
  color,
  label,
  onTabChange,
  disabledTitle,
}: TabButtonProps) {
  const isActive = activeMode === mode
  const isDisabled = disabledTitle !== undefined && !found

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        title={disabledTitle}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
      >
        <span className="w-2 h-2 rounded-full bg-slate-300 inline-block shrink-0" />
        {label}
      </button>
    )
  }

  if (isActive) {
    return (
      <button
        type="button"
        onClick={() => onTabChange(mode)}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        style={{
          backgroundColor: `${color}1a`,
          color,
        }}
      >
        <span
          className="w-2 h-2 rounded-full inline-block shrink-0"
          style={{ backgroundColor: color }}
        />
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onTabChange(mode)}
      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
    >
      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block shrink-0" />
      {label}
    </button>
  )
}

// ============================================================
// Step icon SVGs
// ============================================================

function StepIconComponent({ icon }: { icon: StepIcon }) {
  switch (icon) {
    case 'straight':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Straight</title>
          <path
            d="M8 13V3M8 3L5 6M8 3L11 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'turn-left':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Turn left</title>
          <path
            d="M11 13V7a3 3 0 0 0-3-3H5M5 4L3 6l2 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'turn-right':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Turn right</title>
          <path
            d="M5 13V7a3 3 0 0 1 3-3h3m0 0l2 2-2 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'sharp-left':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Sharp left</title>
          <path
            d="M12 13V8a4 4 0 0 0-4-4H4M4 4L2 7l3 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'sharp-right':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Sharp right</title>
          <path
            d="M4 13V8a4 4 0 0 1 4-4h4m0 0l2 3-3 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'arrive':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Arrive</title>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M5.5 8L7 9.5L10.5 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'accessible':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Accessible</title>
          <circle cx="8" cy="3" r="1.5" fill="currentColor" />
          <path
            d="M8 5v4l2 3M6 8H4M10 13a3 3 0 1 1-4.5-2.6"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

// ============================================================
// Step list item
// ============================================================

function StepItem({ step }: { step: DirectionStep }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-600">
        <StepIconComponent icon={step.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800">{step.instruction}</p>
        {step.durationSec > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">{formatDuration(step.durationSec)}</p>
        )}
      </div>
      {step.isAccessibleSegment && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 shrink-0">
          ♿
        </span>
      )}
    </div>
  )
}

// ============================================================
// BackArrowIcon
// ============================================================

function BackArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <title>Back</title>
      <path
        d="M12 4L6 10L12 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ============================================================
// Main component
// ============================================================

export function DirectionsSheet({
  open,
  standard,
  accessible,
  standardDirections,
  accessibleDirections,
  routesIdentical,
  activeMode,
  onTabChange,
  onBack,
  startNode,
  destNode,
}: DirectionsSheetProps) {
  const [snapPoint, setSnapPoint] = useState<number | string | null>(0.35)

  // Reset to peek snap point every time the sheet opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reset snap only on open transition
  useEffect(() => {
    if (open) setSnapPoint(0.35)
  }, [open])

  // Determine which directions to show
  const activeDirections = activeMode === 'standard' ? standardDirections : accessibleDirections

  // Case 1: Neither route found
  const neitherFound =
    (standard === null || standard.found === false) &&
    (accessible === null || accessible.found === false)

  // Duration line
  const durationText =
    routesIdentical || activeMode === 'standard'
      ? formatDuration(standardDirections.totalDurationSec)
      : formatDuration(accessibleDirections.totalDurationSec)

  return (
    <Drawer.Root
      open={open}
      snapPoints={[0.35, 0.92]}
      activeSnapPoint={snapPoint}
      setActiveSnapPoint={setSnapPoint}
      modal={false}
      dismissible={false}
    >
      <Drawer.Portal>
        {/* Suppress Vaul's auto-injected backdrop — it blocks Konva canvas pan/touch even at opacity:0 */}
        <Drawer.Overlay className="pointer-events-none" />
        {/*
          Issue 1 fix: pointer-events-none on the full-height Drawer.Content wrapper so the
          transparent area above the peek strip doesn't block canvas pan/drag. The inner
          content div restores pointer-events-auto so the visible sheet is still interactive.
        */}
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col outline-none pointer-events-none"
          style={{ maxHeight: '92vh' }}
          aria-label="Route directions"
        >
          {/* Visible sheet — restores pointer events for all interactive elements */}
          <div
            className="flex flex-col rounded-t-2xl bg-white shadow-2xl pointer-events-auto overflow-hidden"
            style={{ maxHeight: '92vh' }}
          >
            {/* Drag handle */}
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-gray-300 shrink-0" />

            {/* Header row: back arrow + route summary */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-slate-100 shrink-0">
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to search"
                className="p-1 text-slate-500 hover:text-slate-700"
              >
                <BackArrowIcon />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {startNode?.label ?? '—'} → {destNode?.label ?? '—'}
                </p>
                {!neitherFound && <p className="text-xs text-slate-500">{durationText}</p>}
              </div>
            </div>

            {/* Case 1: No route found */}
            {neitherFound && (
              <div className="px-5 py-8 text-center text-slate-500">
                <p className="text-lg font-medium">No route found</p>
                <p className="text-sm mt-1">No path connects the selected locations.</p>
              </div>
            )}

            {/* Case 2: Routes identical — single tab chip */}
            {!neitherFound && routesIdentical && (
              <>
                <div className="px-4 pt-2 pb-1 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    Standard (accessible)
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto pb-10">
                  {standardDirections.steps.map((step, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: steps are ordered and stable within a single route render
                    <StepItem key={i} step={step} />
                  ))}
                </div>
              </>
            )}

            {/* Case 3: Two distinct routes */}
            {!neitherFound && !routesIdentical && (
              <>
                <div className="flex gap-2 px-4 pt-3 pb-2 shrink-0">
                  <TabButton
                    mode="standard"
                    activeMode={activeMode}
                    found={standard?.found ?? false}
                    color="#3b82f6"
                    label="Standard"
                    onTabChange={onTabChange}
                  />
                  <TabButton
                    mode="accessible"
                    activeMode={activeMode}
                    found={accessible?.found ?? false}
                    color="#22c55e"
                    label="Accessible"
                    onTabChange={onTabChange}
                    {...(accessible?.found === false
                      ? { disabledTitle: 'No accessible route available' }
                      : {})}
                  />
                </div>
                <div className="flex-1 overflow-y-auto pb-10">
                  {activeDirections.steps.map((step, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: steps are ordered and stable within a single route render
                    <StepItem key={i} step={step} />
                  ))}
                </div>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
