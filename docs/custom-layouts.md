# Custom Layouts

Replace the default hierarchical layout with any algorithm via the `layouter` prop.

## Signature — `NetiPlotLayouter`

```ts
type NetiPlotLayouter = (
  data: {
    nodeMap: Map<string, NetiPlotNode>
    edgeMap: Map<string, NetiPlotEdge>
    shapes?: NetiPlotShapeDefinition[]
  },
  options: NetiPlotLayoutOptions,
  screen: NetiPlotScreen,
  onStopped?: () => void,
) => NetiPlotLayouterResult
```

Set `node.destination = { x, y }` to animate nodes to their target positions. Set `node.x` and `node.y` directly for immediate placement.

Call `onStopped?.()` when the layout is complete — this triggers a fit-to-view if `layoutOptions.fitOnUpdate` is enabled.

## Synchronous layout

```ts
import type { NetiPlotLayouter } from '@jonmodell/netiplot'

const circleLayout: NetiPlotLayouter = (data, options, screen, onStopped) => {
  const nodes = Array.from(data.nodeMap.values())
  const cx = (screen.width ?? 600) / 2
  const cy = (screen.height ?? 400) / 2
  const radius = Math.min(cx, cy) * 0.7

  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2
    node.destination = {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    }
  })

  onStopped?.()
}
```

## Async / force layout

Return `{ stop }` for layouts that run over multiple frames (e.g. force simulations):

```ts
const forceLayout: NetiPlotLayouter = (data, options, screen, onStopped) => {
  const simulation = d3.forceSimulation(/* ... */)

  simulation.on('end', () => onStopped?.())

  return {
    stop: () => simulation.stop(),
  }
}
```

## Controlling when layout re-runs — `ShouldRunLayouter`

By default the layout re-runs whenever the graph changes. Override this with `shouldRunLayouter`:

```ts
// Only re-layout when the number of nodes changes
const shouldRunLayouter: ShouldRunLayouter = (prev, next) =>
  prev.graph.nodes.length !== next.graph.nodes.length
```

## `NetiPlotScreen`

```ts
interface NetiPlotScreen {
  width: number | undefined
  height: number | undefined
  ratio: number
  boundingRect: DOMRect | undefined | null
}
```
