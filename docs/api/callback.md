# Programmatic Access — `callbackFn`

The `callbackFn` prop provides imperative access to the network after it mounts.

```ts
<NetiPlotReact
  graph={graph}
  callbackFn={({ fit, getCamera, getPositions }) => {
    fit()            // zoom to fit all nodes
    getCamera()      // → PanScaleState
    getPositions()   // → Record<id, { x, y }>
  }}
/>
```

## `NetiPlotCallbackData`

| Field | Type | Description |
|-------|------|-------------|
| `fit` | `() => boolean` | Zoom to fit all nodes into view |
| `getCamera` | `() => PanScaleState` | Current pan and scale state |
| `getPositions` | `() => Record<string, { x: number; y: number }>` | Current node positions by ID |
| `getNodePositions` | `(nodes: Map<string, NetiPlotNode>) => Record<string, { x, y }>` | Positions from a given node map |
| `nodes` | `React.RefObject<Map<string, NetiPlotNode>>` | Ref to the live node map |

## Storing the callback ref

A common pattern is to store the callback data in a ref so you can call it later:

```tsx
const netRef = useRef<NetiPlotCallbackData | null>(null)

<NetiPlotReact
  graph={graph}
  callbackFn={(data) => { netRef.current = data }}
/>

// Elsewhere:
<button onClick={() => netRef.current?.fit()}>Fit all</button>
```

## `PanScaleState`

```ts
type PanScaleState = {
  pan: { x: number; y: number }
  scale: number
  destinationPan: { x: number; y: number } | null
  destinationScale: number | null
  panPerFrame: { x: number; y: number } | null
}
```
