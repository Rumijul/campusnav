import type { NavNode, NavNodeType } from '@shared/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { StudentGpsState } from '../gps/studentGpsState'
import { useLocationSearch } from '../hooks/useLocationSearch'
import type { RouteSelection } from '../hooks/useRouteSelection'

/* ──────────────── Constants ──────────────── */

const TYPE_COLORS: Record<string, string> = {
  room: '#3b82f6',
  entrance: '#22c55e',
  elevator: '#a855f7',
  restroom: '#f59e0b',
  landmark: '#ef4444',
}

const TYPE_LABELS: Record<string, string> = {
  room: 'Room',
  entrance: 'Entrance',
  elevator: 'Elevator',
  restroom: 'Restroom',
  landmark: 'Landmark',
}

/** POI types available for nearest search */
const NEAREST_POI_TYPES: Array<{ type: NavNodeType; label: string }> = [
  { type: 'restroom', label: 'Nearest Restroom' },
  { type: 'elevator', label: 'Nearest Elevator' },
  { type: 'entrance', label: 'Nearest Entrance' },
]

/* ──────────────── Props ──────────────── */

interface SearchOverlayProps {
  selection: RouteSelection
  nodes: NavNode[]
  onRouteTrigger: () => void
  /** Optional geolocation-derived state for use-location action + fallback copy. */
  gpsState?: StudentGpsState | null
  /** Sets route start from nearest walkable node to current GPS fix. */
  onUseMyLocation?: () => void
  /** When true (sheet is open), compact strip collapses to a minimal pill */
  sheetOpen?: boolean
  /** Called when user taps the compact A→B strip to reopen the directions sheet */
  onOpenSheet?: () => void
  /** True when a route result is available (sheet can be reopened) */
  hasRoute?: boolean
}

/* ──────────────── Component ──────────────── */

/**
 * Search overlay — dual search bars, full-screen suggestions, compact strip.
 *
 * Rendered as an HTML overlay above the Konva canvas. Uses absolute/fixed
 * positioning with z-index to float above the map.
 */
export function SearchOverlay({
  selection,
  nodes,
  onRouteTrigger,
  gpsState,
  onUseMyLocation,
  sheetOpen = false,
  onOpenSheet,
  hasRoute = false,
}: SearchOverlayProps) {
  const { query, results, search, searchNearest, clearSearch } = useLocationSearch(nodes)
  const [focusedField, setFocusedField] = useState<'start' | 'destination' | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [nearestResults, setNearestResults] = useState<NavNode[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Determine mode: compact when both are selected and not actively searching
  const isCompact = selection.bothSelected && focusedField === null

  // When both become selected, auto-trigger route
  const prevBothRef = useRef(selection.bothSelected)
  useEffect(() => {
    if (selection.bothSelected && !prevBothRef.current) {
      setFocusedField(null)
      setShowSuggestions(false)
      clearSearch()
      onRouteTrigger()
    }
    prevBothRef.current = selection.bothSelected
  }, [selection.bothSelected, onRouteTrigger, clearSearch])

  // Focus input when suggestions panel opens
  useEffect(() => {
    if (showSuggestions && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showSuggestions])

  const handleInputFocus = useCallback(
    (field: 'start' | 'destination') => {
      setFocusedField(field)
      setShowSuggestions(true)
      setNearestResults([])
      selection.setActiveField(field)
      // Reset search when opening a field
      search('')
    },
    [selection, search],
  )

  const handleInputChange = useCallback(
    (value: string) => {
      search(value)
      setNearestResults([])
    },
    [search],
  )

  const handleSelectSuggestion = useCallback(
    (node: NavNode) => {
      if (focusedField === 'start') {
        selection.setStart(node)
      } else if (focusedField === 'destination') {
        selection.setDestination(node)
      }
      setShowSuggestions(false)
      setFocusedField(null)
      clearSearch()
      setNearestResults([])
    },
    [focusedField, selection, clearSearch],
  )

  const handleCloseSuggestions = useCallback(() => {
    setShowSuggestions(false)
    setFocusedField(null)
    clearSearch()
    setNearestResults([])
  }, [clearSearch])

  const handleNearestSearch = useCallback(
    (poiType: NavNodeType) => {
      if (!selection.start) return
      const nearest = searchNearest(selection.start, poiType)
      setNearestResults(nearest)
      // Clear text-based results to show only nearest results
      search('')
    },
    [selection.start, searchNearest, search],
  )

  const handleSwap = useCallback(() => {
    selection.swap()
  }, [selection])

  const canUseMyLocation = gpsState?.canUseMyLocation === true && onUseMyLocation != null

  const handleUseMyLocation = useCallback(() => {
    if (!canUseMyLocation) return
    onUseMyLocation?.()
  }, [canUseMyLocation, onUseMyLocation])

  // Handle keyboard escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSuggestions) {
        handleCloseSuggestions()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showSuggestions, handleCloseSuggestions])

  // Compact strip mode
  if (isCompact) {
    // When the directions sheet is open, collapse to a minimal pill so it
    // doesn't compete for screen space with the sheet.
    if (sheetOpen) {
      return (
        <div className="absolute top-2 left-2 z-30 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Route active</span>
            <button
              type="button"
              className="p-0.5 text-slate-400 hover:text-slate-700"
              onClick={() => selection.clearAll()}
              aria-label="Clear route"
            >
              <ClearIcon />
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
          <button
            type="button"
            className="flex-1 min-w-0 flex items-center gap-1 text-sm text-left"
            onClick={() => {
              if (hasRoute && onOpenSheet) {
                onOpenSheet()
              } else {
                setFocusedField(null)
                prevBothRef.current = selection.bothSelected
              }
            }}
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold shrink-0">
              A
            </span>
            <span className="truncate text-slate-700">{selection.start?.label}</span>
            <span className="text-slate-400 mx-1">&rarr;</span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold shrink-0">
              B
            </span>
            <span className="truncate text-slate-700">{selection.destination?.label}</span>
          </button>
          <button
            type="button"
            className="p-1 text-slate-500 hover:text-slate-700"
            onClick={handleSwap}
            aria-label="Swap start and destination"
          >
            <SwapIcon />
          </button>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700"
            onClick={() => selection.clearAll()}
            aria-label="Clear route"
          >
            <ClearIcon />
          </button>
        </div>
      </div>
    )
  }

  // Full-screen suggestions overlay
  if (showSuggestions && focusedField) {
    const displayResults = nearestResults.length > 0 ? nearestResults : results
    const showNearestButtons =
      focusedField === 'destination' && selection.start !== null && query.length < 2

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col pointer-events-auto">
        {/* Header with back button and input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200">
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700"
            onClick={handleCloseSuggestions}
            aria-label="Close search"
          >
            <BackIcon />
          </button>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 py-2 px-3 text-base outline-none bg-transparent placeholder:text-slate-400"
            placeholder={
              focusedField === 'start' ? 'Search start location...' : 'Search destination...'
            }
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
          />
          {query.length > 0 && (
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600"
              onClick={() => {
                search('')
                setNearestResults([])
              }}
              aria-label="Clear input"
            >
              <ClearIcon />
            </button>
          )}
        </div>

        {/* Nearest POI quick-filter buttons */}
        {showNearestButtons && (
          <div className="flex gap-2 px-4 py-3 border-b border-slate-100">
            {NEAREST_POI_TYPES.map((poi) => (
              <button
                key={poi.type}
                type="button"
                className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors"
                onClick={() => handleNearestSearch(poi.type)}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                  style={{ backgroundColor: TYPE_COLORS[poi.type] }}
                />
                {poi.label}
              </button>
            ))}
          </div>
        )}

        {/* Suggestion list */}
        <div className="flex-1 overflow-y-auto">
          {displayResults.length === 0 && query.length >= 2 && nearestResults.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">No results found</div>
          )}
          {displayResults.map((node) => (
            <button
              key={node.id}
              type="button"
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
              onClick={() => handleSelectSuggestion(node)}
            >
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: TYPE_COLORS[node.type] ?? '#64748b' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{node.label}</div>
                <div className="text-xs text-slate-400 flex gap-1 items-center">
                  {node.roomNumber && (
                    <>
                      <span>Room {node.roomNumber}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{TYPE_LABELS[node.type] ?? node.type}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Expanded mode — dual search bars
  return (
    <div className="absolute top-2 left-2 right-2 z-30 pointer-events-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3">
        <div className="flex items-center gap-2">
          {/* Left: Search fields stacked */}
          <div className="flex-1 flex flex-col gap-2">
            {/* From field */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold shrink-0">
                A
              </span>
              <button
                type="button"
                className="flex-1 text-left text-sm truncate"
                onClick={() => handleInputFocus('start')}
              >
                {selection.start ? (
                  <span className="text-slate-800">{selection.start.label}</span>
                ) : (
                  <span className="text-slate-400">Search start location...</span>
                )}
              </button>
              {selection.start && (
                <button
                  type="button"
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                  onClick={() => selection.clearStart()}
                  aria-label="Clear start"
                >
                  <ClearIcon />
                </button>
              )}
            </div>

            {/* To field */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold shrink-0">
                B
              </span>
              <button
                type="button"
                className="flex-1 text-left text-sm truncate"
                onClick={() => handleInputFocus('destination')}
              >
                {selection.destination ? (
                  <span className="text-slate-800">{selection.destination.label}</span>
                ) : (
                  <span className="text-slate-400">Search destination...</span>
                )}
              </button>
              {selection.destination && (
                <button
                  type="button"
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                  onClick={() => selection.clearDestination()}
                  aria-label="Clear destination"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
          </div>

          {/* Swap button */}
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 self-center"
            onClick={handleSwap}
            aria-label="Swap start and destination"
          >
            <SwapIcon />
          </button>
        </div>

        {gpsState && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                canUseMyLocation
                  ? 'text-blue-600 hover:text-blue-700'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
              aria-label="Use my location"
              onClick={handleUseMyLocation}
              disabled={!canUseMyLocation}
            >
              <MyLocationIcon />
              <span>Use my location</span>
            </button>

            {gpsState.fallbackMessage && (
              <p className="mt-1 text-xs text-slate-500">{gpsState.fallbackMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────── Icons ──────────────── */

function SwapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <title>Swap</title>
      <path
        d="M7 3L7 17M7 17L3 13M7 17L11 13M13 17L13 3M13 3L9 7M13 3L17 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <title>Clear</title>
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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

function MyLocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <title>My location</title>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.5V3M8 13V14.5M14.5 8H13M3 8H1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
