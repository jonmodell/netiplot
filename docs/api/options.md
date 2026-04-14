# Options — `NetiPlotOptions`

The `options` prop accepts a nested configuration object. All fields are optional.

```ts
<NetiPlotReact
  graph={graph}
  options={{
    nodes: { showLabels: true, defaultSize: 24 },
    edges: { arrowheads: true },
    layoutOptions: { fitOnUpdate: true },
  }}
/>
```

## `nodes` — `NetiPlotNodeOptions`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `showLabels` | `boolean` | `true` | Show node labels |
| `defaultSize` | `number` | `20` | Default node radius in pixels |
| `nodeFillStyle` | `string` | | Default fill colour for nodes |
| `scaleCompensation` | `false` | | Disable size scaling with zoom |

## `edges` — `NetiPlotEdgeOptions`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `showLabels` | `boolean` | `false` | Show edge labels |
| `arrowheads` | `boolean` | `false` | Render arrowheads on edges |
| `lineStyle` | `string` | `'solid'` | `'solid'` or `'dashed'` |

## `cameraOptions` — `NetiPlotCameraOptions`

| Field | Type | Description |
|-------|------|-------------|
| `fitAllPadding` | `{ horizontal: number; vertical: number }` | Padding applied when fitting all nodes into view |

## `layoutOptions` — `NetiPlotLayoutOptions`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fitOnUpdate` | `boolean` | `false` | Zoom to fit after each layout run |

Additional keys are passed through to custom layouter functions.

## `hover` — `NetiPlotHoverOptions`

Tooltip shown when hovering a node or edge (React renderer).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `nodeRenderer` | `(node) => ReactNode \| null` | | Render tooltip content for a node |
| `edgeRenderer` | `(edge) => ReactNode \| null` | | Render tooltip content for an edge |
| `delay` | `number` | `750` | Milliseconds before tooltip appears |
| `width` | `number` | `200` | Tooltip width in px (used for positioning) |
| `height` | `number` | `150` | Tooltip height in px (used for positioning) |

```ts
hover: {
  nodeRenderer: (node) => <div><strong>{node.label}</strong></div>,
  delay: 400,
}
```

## `interaction` — `NetiPlotInteractionOptions`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `allowGraphInteraction` | `boolean` | `true` | Allow dragging nodes |
| `allowShapeInteraction` | `boolean` | `false` | Allow selecting and resizing background shapes |

## `showMutedOverlay` — `boolean`

When `true`, renders a semi-transparent overlay behind the edit layer.
