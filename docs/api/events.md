# Mouse Events

Handle user interactions via the `onMouse` prop.

```ts
<NetiPlotReact
  graph={graph}
  onMouse={(type, item, event) => {
    console.log(type, item)
  }}
/>
```

## Callback signature — `NetiPlotMouseHandler`

```ts
type NetiPlotMouseHandler = (
  type: NetiPlotMouseEventType,
  item?: NetiPlotNodeDefinition
        | NetiPlotEdgeDefinition
        | NetiPlotShapeDefinition
        | NetiPlotNodeDefinition[]
        | NetiPlotShapeDefinition[]
        | null,
  event?: MouseEvent,
) => void
```

## Event types — `NetiPlotMouseEventType`

| Type | `item` value | Description |
|------|-------------|-------------|
| `'nodeClick'` | `NetiPlotNodeDefinition` | Single click on a node |
| `'nodeDblClick'` | `NetiPlotNodeDefinition` | Double-click on a node |
| `'nodesDragged'` | `NetiPlotNodeDefinition[]` | One or more nodes dragged |
| `'edgeClick'` | `NetiPlotEdgeDefinition` | Single click on an edge |
| `'edgeDblClick'` | `NetiPlotEdgeDefinition` | Double-click on an edge |
| `'shapeClick'` | `NetiPlotShapeDefinition` | Click on a background shape |
| `'shapeDblClick'` | `NetiPlotShapeDefinition` | Double-click on a background shape |
| `'shapeUpdate'` | `NetiPlotShapeDefinition` | Shape moved or resized |
| `'backgroundClick'` | `null` | Click on empty canvas area |

## Example

```ts
onMouse={(type, item) => {
  if (type === 'nodeClick') {
    const node = item as NetiPlotNodeDefinition
    console.log('Clicked node:', node.id, node.label)
  }
  if (type === 'backgroundClick') {
    clearSelection()
  }
}}
```

## Drag interaction

Drag is enabled by default. Disable it via `options.interaction`:

```ts
options={{ interaction: { allowGraphInteraction: false } }}
```
