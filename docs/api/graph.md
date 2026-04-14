# Graph Data

The `graph` prop accepts a `NetiPlotGraph` object containing arrays of nodes and edges.

```ts
const graph: NetiPlotGraph = {
  nodes: [...],
  edges: [...],
}
```

## Node definition — `NetiPlotNodeDefinition`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✓ | Unique identifier |
| `label` | `string` | | Text label rendered below the node |
| `innerLabel` | `string` | | Short text rendered inside the node circle |
| `shape` | `string` | | Node shape: `'circle'` (default), `'square'`, `'image'` |
| `size` | `number` | | Override `defaultSize` for this node |
| `image` | `string` | | Key into the `images` map |
| `type` | `string` | | Arbitrary type string, available in drawing functions |
| `fixed` | `boolean` | | Exclude this node from layout calculations |
| `x` | `number` | | Initial x position |
| `y` | `number` | | Initial y position |
| `style` | `NodeStyle` | | Visual overrides (see below) |
| `[key: string]` | `any` | | Any extra field — available in `nodeDrawingFunction` |

### Node style

```ts
style?: {
  background?: string   // fill colour
  border?: string       // stroke colour
  size?: number         // size override (same as top-level size)
  [key: string]: any    // additional fields for custom drawing
}
```

## Edge definition — `NetiPlotEdgeDefinition`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✓ | Unique identifier |
| `from` | `string` | ✓ | Source node ID |
| `to` | `string` | ✓ | Target node ID |
| `label` | `string` | | Text label rendered on the edge |
| `size` | `number` | | Line width override |
| `style` | `NetiPlotEdgeStyle` | | Visual overrides (see below) |

### Edge style

```ts
style?: {
  color?: string       // line colour
  lineWidth?: number   // line width in pixels
  font?: string        // label font string
  fontColor?: string   // label font colour
}
```

## Example

```ts
const graph: NetiPlotGraph = {
  nodes: [
    { id: 'web',  label: 'Web App',  style: { background: '#3b82f6' } },
    { id: 'api',  label: 'API',      style: { background: '#8b5cf6' } },
    { id: 'db',   label: 'Database', style: { background: '#10b981' } },
  ],
  edges: [
    { id: 'e1', from: 'web', to: 'api' },
    { id: 'e2', from: 'api', to: 'db',  style: { color: '#ef4444' } },
  ],
}
```
