# React Component

`<NetiPlotReact>` is a React component that renders a network graph on layered HTML5 canvases. It is driven entirely by props and re-renders via `useSyncExternalStore`.

## Minimal example

```tsx
import { NetiPlotReact } from '@jonmodell/netiplot'
import type { NetiPlotGraph } from '@jonmodell/netiplot'

const graph: NetiPlotGraph = {
  nodes: [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
  ],
  edges: [{ id: 'e1', from: 'a', to: 'b' }],
}

export default function MyGraph() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '600px', overflow: 'hidden' }}>
      <NetiPlotReact graph={graph} />
    </div>
  )
}
```

## Key props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `graph` | `NetiPlotGraph` | ✓ | Nodes and edges to render |
| `options` | `NetiPlotOptions` | | Display and behaviour configuration |
| `shapes` | `NetiPlotShapeDefinition[]` | | Background shapes drawn behind the graph |
| `onMouse` | `NetiPlotMouseHandler` | | Click, drag, and hover events |
| `layouter` | `NetiPlotLayouter` | | Custom layout algorithm (default: hierarchical) |
| `shouldRunLayouter` | `ShouldRunLayouter` | | Predicate controlling when layout re-runs |
| `callbackFn` | `(data: NetiPlotCallbackData) => void` | | Programmatic access (fit, camera, positions) |
| `nodeDrawingFunction` | `NodeDrawingFunction` | | Custom canvas draw function per node |
| `shapeDrawingFunction` | `ShapeDrawingFunction` | | Custom canvas draw function per shape |
| `images` | `NetiPlotImageMap` | | Image map for node icons |
| `customControls` | `(data) => ReactNode \| null` | | Replace or hide zoom controls |
| `identifier` | `string` | | Stable instance ID |
| `className` | `string` | | CSS class on the container div |

See the [Props reference](/docs/api/props) for full type details.

## Updating the graph

Pass a new `graph` object to trigger a re-render. The engine diffs the incoming data and only updates changed nodes and edges.

```tsx
const [graph, setGraph] = useState(initialGraph)

// Add a node
setGraph(prev => ({
  ...prev,
  nodes: [...prev.nodes, { id: 'new', label: 'New node' }],
}))
```
