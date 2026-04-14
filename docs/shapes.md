# Background Shapes

Background shapes are decorative or structural elements rendered behind the graph. Pass them via the `shapes` prop.

## Shape definition — `NetiPlotShapeDefinition`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | | Unique identifier |
| `shape` | `string` | ✓ | Shape type: `'rect'`, `'circle'`, `'ellipse'`, `'image'`, or custom |
| `x` | `number` | ✓ | Left edge position in graph coordinates |
| `y` | `number` | ✓ | Top edge position in graph coordinates |
| `width` | `number` | | Width in graph coordinates |
| `height` | `number` | | Height in graph coordinates |
| `size` | `number` | | Shorthand for square shapes (sets both width and height) |
| `style` | `NetiPlotShapeStyle` | | Visual properties |
| `visible` | `boolean` | | Hide without removing (default `true`) |
| `noEdit` | `boolean` | | Prevent resize/move handles |
| `noClick` | `boolean` | | Suppress click events |
| `boundsIgnore` | `boolean` | | Exclude from fit-to-view bounds calculation |

### Shape style — `NetiPlotShapeStyle`

```ts
style?: {
  background?: string                        // fill colour
  border?: string | CanvasGradient          // stroke colour (alias: stroke, line)
  lineWidth?: number                         // stroke width in pixels
  fillColor?: string                         // alias for background (alias: fill)
  strokeColor?: string                       // alias for border
}
```

## Example

```ts
const shapes: NetiPlotShapeDefinition[] = [
  {
    id: 'region-a',
    shape: 'rect',
    x: 50, y: 50,
    width: 300, height: 200,
    style: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: '#3b82f6',
      lineWidth: 1,
    },
  },
  {
    id: 'zone',
    shape: 'circle',
    x: 400, y: 200,
    size: 120,
    style: { background: 'rgba(16, 185, 129, 0.15)' },
    noEdit: true,
  },
]
```

## Shape interaction

Enable shape editing (drag to move, handles to resize) via options:

```ts
options={{ interaction: { allowShapeInteraction: true } }}
```

Shape move and resize events fire as `'shapeUpdate'` on the `onMouse` callback.

## Custom shape drawing

Use `shapeDrawingFunction` to fully control how a shape is rendered. See [Custom drawing](/docs/custom-drawing).
