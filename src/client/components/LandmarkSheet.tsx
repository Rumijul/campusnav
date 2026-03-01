import type { NavNode } from '@shared/types'
import { useState } from 'react'
import { Drawer } from 'vaul'

interface LandmarkSheetProps {
  node: NavNode | null
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  room: 'Room',
  entrance: 'Entrance',
  elevator: 'Elevator',
  restroom: 'Restroom',
  landmark: 'Point of Interest',
}

export function LandmarkSheet({ node, onClose }: LandmarkSheetProps) {
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(0.15)

  // Reset to peek snap point whenever a new node is selected.
  // key={node?.id} on Drawer.Root remounts the drawer for each new node,
  // resetting activeSnapPoint to 0.15 (peek) automatically — no useEffect needed.

  return (
    <Drawer.Root
      key={node?.id ?? 'none'}
      open={node !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      snapPoints={[0.15, 0.9]}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      modal={false}
      dismissible={true}
    >
      <Drawer.Portal>
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-2xl outline-none focus:outline-none"
          style={{ maxHeight: '90vh' }}
          aria-label={node?.label ?? 'Location details'}
        >
          {/* Drag handle */}
          <div className="mx-auto mt-3 h-1.5 w-10 flex-shrink-0 rounded-full bg-gray-300" />

          {/* Peek content — always visible */}
          <div className="flex items-center justify-between px-5 pb-2 pt-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{node?.label}</h2>
              <p className="text-sm font-medium capitalize text-gray-500">
                {TYPE_LABELS[node?.type ?? ''] ?? node?.type}
              </p>
            </div>
            <Drawer.Close asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                onClick={onClose}
                aria-label="Close"
              >
                <span aria-hidden>×</span>
              </button>
            </Drawer.Close>
          </div>

          {/* Full detail content — visible when expanded */}
          <div className="overflow-y-auto px-5 pb-10 pt-1">
            {node?.roomNumber && (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Room</p>
                <p className="text-sm text-gray-700">{node.roomNumber}</p>
              </div>
            )}
            {node?.description && (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Description
                </p>
                <p className="text-sm text-gray-700">{node.description}</p>
              </div>
            )}
            {node?.floorId !== undefined && (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Floor</p>
                <p className="text-sm text-gray-700">{node.floorId}</p>
              </div>
            )}
            {node?.accessibilityNotes && (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Accessibility
                </p>
                <p className="text-sm text-gray-700">{node.accessibilityNotes}</p>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
