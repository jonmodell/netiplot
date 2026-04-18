# Vanilla JS Class

`NetiPlot` is a framework-agnostic class that manages its own DOM structure. Use it in any environment without React.

## Basic usage

```ts
import { NetiPlot } from '@jonmodell/netiplot/vanilla'

const container = document.getElementById('network')

const net = new NetiPlot(container, {
  graph: {
    nodes: [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ],
    edges: [{ id: 'e1', from: 'a', to: 'b' }],
  },
  options: {
    nodes: { showLabels: true },
    edges: { arrowheads: true },
  },
})
```

The container must have an explicit width and height. `position: relative` is set automatically if not already applied.

## Instance methods

| Method | Description |
|--------|-------------|
| `setGraph(graph, shapes?)` | Replace graph data. Triggers layout if nodes/edges changed. |
| `setOptions(options)` | Update options. |
| `zoom(level)` | `'in' \| 'out' \| 'all' \| 'selection'` |
| `fit()` | Zoom to fit all nodes. |
| `getCamera()` | Returns current `PanScaleState`. |
| `getNodePositions()` | Returns `Record<id, { x, y }>`. |
| `destroy()` | Removes all DOM elements and cleans up event listeners. |

## Hover tooltips

The vanilla class uses a callback-based hover API (no React):

```ts
const net = new NetiPlot(container, {
  graph,
  hover: {
    nodeRenderer: (node) => `<strong>${node.label}</strong>`,  // HTML string or HTMLElement
    edgeRenderer: (edge) => `Edge: ${edge.id}`,
    delay: 500,
  },
})
```

The tooltip `div` has class `netiplot-tooltip` — style it however you like.

## Constructor config

| Field | Type | Description |
|-------|------|-------------|
| `graph` | `NetiPlotGraph` | Required. Nodes and edges. |
| `options` | `NetiPlotOptions` | Display and behaviour options. |
| `shapes` | `NetiPlotShapeDefinition[]` | Background shapes. |
| `layouter` | `NetiPlotLayouter` | Custom layout algorithm. |
| `shouldRunLayouter` | `ShouldRunLayouter` | Predicate for layout re-runs. |
| `onMouse` | `NetiPlotMouseHandler` | Mouse event callback. |
| `nodeDrawingFunction` | `NodeDrawingFunction` | Custom canvas draw per node. |
| `shapeDrawingFunction` | `ShapeDrawingFunction` | Custom canvas draw per shape. |
| `images` | `NetiPlotImageMap` | Image map for node icons. |
| `identifier` | `string` | Stable instance ID. |
| `hover` | `NetiPlotHoverConfig` | Tooltip configuration. |
