# Custom Node Drawing

Override the default node renderer with a canvas drawing function via the `nodeDrawingFunction` prop.

## Signature — `NodeDrawingFunction`

```ts
type NodeDrawingFunction = (
  ctx: CanvasRenderingContext2D,
  node: NetiPlotNodeDefinition,
) => void
```

The context is already translated to the node centre — `(0, 0)` is the middle of the node. The context is also scaled for the current device pixel ratio.

## Example

```ts
const nodeDrawingFunction: NodeDrawingFunction = (ctx, node) => {
  const size = node.size ?? 20
  const color = node.style?.background ?? '#4a90e2'

  // Draw circle
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // Draw label
  if (node.label) {
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${size * 0.6}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(node.label, 0, 0)
  }
}
```

## Custom node properties

Any extra field on a node definition is passed through to the drawing function:

```ts
// Define nodes with custom fields
{ id: 'a', label: 'Alert', severity: 'high', count: 3 }

// Access in the drawing function
const nodeDrawingFunction: NodeDrawingFunction = (ctx, node) => {
  if (node.severity === 'high') {
    ctx.fillStyle = '#ef4444'
  }
  // draw badge using node.count
}
```

## Custom shape drawing — `ShapeDrawingFunction`

Background shapes use the same pattern via `shapeDrawingFunction`:

```ts
type ShapeDrawingFunction = (
  ctx: CanvasRenderingContext2D,
  shape: NetiPlotShapeDefinition,
) => void
```

The context origin is at the shape's `(x, y)` position. Width and height are available on the shape definition.
