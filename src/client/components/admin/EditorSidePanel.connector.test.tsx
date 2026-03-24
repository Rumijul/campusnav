import type { NavEdge, NavNode } from '@shared/types'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import EditorSidePanel from './EditorSidePanel'

function makeNode(overrides: Partial<NavNode> & { id: string; floorId: number }): NavNode {
  return {
    id: overrides.id,
    floorId: overrides.floorId,
    x: 0.4,
    y: 0.6,
    label: overrides.label ?? overrides.id,
    type: overrides.type ?? 'room',
    searchable: overrides.searchable ?? true,
    ...overrides,
  }
}

function makeEdge(): NavEdge & { sourceName: string; targetName: string } {
  return {
    id: 'edge-1',
    sourceId: 'a',
    targetId: 'b',
    sourceName: 'A',
    targetName: 'B',
    standardWeight: 1,
    accessibleWeight: 1,
    accessible: true,
    bidirectional: true,
  }
}

const noop = () => {}

describe('EditorSidePanel connector controls', () => {
  it('renders floor connection dropdowns with unlink and inline connector error for connector nodes', () => {
    const connectorNode = makeNode({
      id: 'stairs-f2',
      floorId: 102,
      type: 'stairs',
      label: 'Stairs F2',
      connectsToNodeAboveId: 'ramp-f3',
    })

    const html = renderToStaticMarkup(
      <EditorSidePanel
        selectedNode={connectorNode}
        selectedEdge={null}
        onUpdateNode={noop}
        onUpdateEdge={noop}
        onDeleteNode={noop}
        onDeleteEdge={noop}
        onClose={noop}
        isCampusActive={false}
        connectorCandidates={{
          above: [
            {
              nodeId: 'ramp-f3',
              floorId: 103,
              floorNumber: 3,
              buildingId: 1,
              buildingName: 'Science',
              label: 'Upper Ramp',
              nodeType: 'ramp',
            },
          ],
          below: [
            {
              nodeId: 'elevator-f1',
              floorId: 101,
              floorNumber: 1,
              buildingId: 1,
              buildingName: 'Science',
              label: 'Lower Elevator',
              nodeType: 'elevator',
            },
          ],
        }}
        onConnectorLinkChange={vi.fn()}
        connectorLinkError="LINK_VALIDATION_ERROR: Direction mismatch"
        isConnectorLinkPending={false}
      />,
    )

    expect(html).toContain('Floor Connections')
    expect(html).toContain('Above')
    expect(html).toContain('Below')
    expect(html).toContain('Unlink')
    expect(html).toContain('Floor 3')
    expect(html).toContain('Upper Ramp')
    expect(html).toContain('LINK_VALIDATION_ERROR: Direction mismatch')
  })

  it('does not render floor connection controls for non-connector nodes', () => {
    const roomNode = makeNode({ id: 'room-101', floorId: 101, type: 'room', label: 'Room 101' })

    const html = renderToStaticMarkup(
      <EditorSidePanel
        selectedNode={roomNode}
        selectedEdge={null}
        onUpdateNode={noop}
        onUpdateEdge={noop}
        onDeleteNode={noop}
        onDeleteEdge={noop}
        onClose={noop}
        connectorCandidates={{ above: [], below: [] }}
        onConnectorLinkChange={vi.fn()}
      />,
    )

    expect(html).not.toContain('Floor Connections')
    expect(html).not.toContain('connector-above')
    expect(html).not.toContain('connector-below')
  })

  it('keeps edge editing mode unchanged when only an edge is selected', () => {
    const html = renderToStaticMarkup(
      <EditorSidePanel
        selectedNode={null}
        selectedEdge={makeEdge()}
        onUpdateNode={noop}
        onUpdateEdge={noop}
        onDeleteNode={noop}
        onDeleteEdge={noop}
        onClose={noop}
        connectorCandidates={{ above: [], below: [] }}
        onConnectorLinkChange={vi.fn()}
      />,
    )

    expect(html).toContain('Edge Properties')
    expect(html).not.toContain('Floor Connections')
    expect(html).toContain('Connection')
  })
})
