import type { PathResult } from '@shared/pathfinding/types'
import type { NavNode } from '@shared/types'
import { useEffect, useRef, useState } from 'react'
import type { DirectionStep, DirectionsResult, StepIcon } from '../hooks/useRouteDirections'
import { groupDirectionSections } from './directionSections'

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

function DirectionSectionList({ steps }: { steps: DirectionStep[] }) {
  const sections = groupDirectionSections(steps)
  const showFloorHeaders = sections.length > 1

  return (
    <>
      {sections.map((section, sectionIndex) => (
        <div key={`${section.floorId}-${section.floorNumber}-${sectionIndex}`}>
          {showFloorHeaders && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Floor {section.floorNumber}
              </p>
            </div>
          )}
          {section.steps.map((step, stepIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: steps are ordered and stable within a single route render
            <StepItem key={`${sectionIndex}-${stepIndex}`} step={step} />
          ))}
        </div>
      ))}
    </>
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
// Main component — custom bottom sheet (no Vaul)
//
// Renders as position:fixed bottom-0 — only covers the visible
// peek/expanded area. No full-viewport overlay. No pointer-event
// blocking above the sheet.
// ============================================================

const PEEK_HEIGHT = 260 // px — header + handle + first step hint
const EXPANDED_MAX = 0.92 // fraction of window height

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
  const [expanded, setExpanded] = useState(false)
  const sheetRef = useRef<HTMLElement>(null)

  // Reset to peek whenever sheet opens
  useEffect(() => {
    if (open) setExpanded(false)
  }, [open])

  // Drag state
  const dragStartY = useRef<number | null>(null)
  const dragStartExpanded = useRef(false)

  function onDragStart(clientY: number) {
    dragStartY.current = clientY
    dragStartExpanded.current = expanded
  }

  function onDragMove(clientY: number) {
    if (dragStartY.current === null) return
    const dy = dragStartY.current - clientY // positive = dragging up
    if (dy > 40) setExpanded(true)
    if (dy < -40) setExpanded(false)
  }

  function onDragEnd() {
    dragStartY.current = null
  }

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

  const expandedHeight = `${Math.round(window.innerHeight * EXPANDED_MAX)}px`
  const currentHeight = expanded ? expandedHeight : `${PEEK_HEIGHT}px`

  if (!open) return null

  return (
    <section
      ref={sheetRef}
      aria-label="Route directions"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-2xl"
      style={{
        height: currentHeight,
        transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          onDragStart(e.clientY)
        }}
        onPointerMove={(e) => onDragMove(e.clientY)}
        onPointerUp={() => onDragEnd()}
        onPointerCancel={() => onDragEnd()}
      >
        <div className="h-1.5 w-10 rounded-full bg-gray-300" />
      </div>

      {/* Header row: back arrow + route summary */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2 border-b border-slate-100 shrink-0">
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
        {/* Expand / collapse toggle */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse directions' : 'Expand directions'}
          className="p-1 text-slate-400 hover:text-slate-600 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <title>Toggle</title>
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable content — only visible when expanded */}
      <div className="flex-1 overflow-y-auto">
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
            <div className="pb-10">
              <DirectionSectionList steps={standardDirections.steps} />
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
            <div className="pb-10">
              <DirectionSectionList steps={activeDirections.steps} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
