# Props — `<NetiPlotReact>`

All props accepted by the `NetiPlotReact` component (`NetiPlotProps` in `types.ts`).

## Required

### `graph` — `NetiPlotGraph`

The graph data to render. See [Graph data](/docs/api/graph) for the full type.

```ts
graph={{ nodes: [...], edges: [...] }}
```

## Display

### `options` — `NetiPlotOptions`

Nested configuration object. See [Options](/docs/api/options).

### `shapes` — `NetiPlotShapeDefinition[]`

Background shapes rendered behind the graph. See [Background shapes](/docs/shapes).

### `className` — `string`

CSS class name applied to the outermost container div.

### `customControls` — `((data: CustomControlsData) => ReactNode) | null`

Replace the built-in zoom controls with a custom renderer. Pass `null` to hide controls entirely.

```ts
customControls={({ zoomIn, zoomOut, fitAll }) => (
  <button onClick={fitAll}>Fit</button>
)}
```

## Interaction

### `onMouse` — `NetiPlotMouseHandler`

Mouse event callback. See [Mouse events](/docs/api/events).

### `nodeDrawingFunction` — `NodeDrawingFunction`

Custom canvas draw function called for every node. See [Custom drawing](/docs/custom-drawing).

### `shapeDrawingFunction` — `ShapeDrawingFunction`

Custom canvas draw function called for every background shape.

### `images` — `NetiPlotImageMap`

Map of image IDs to `HTMLImageElement`, `SVGImageElement`, `HTMLCanvasElement`, or an object with `{ element, scale?, offsetX?, offsetY? }`.

```ts
const img = new Image()
img.src = '/icon.png'
images={{ myIcon: img }}
// then on node: { id: 'n1', image: 'myIcon' }
```

## Layout

### `layouter` — `NetiPlotLayouter`

Custom layout algorithm function. Defaults to built-in hierarchical layout. See [Custom layouts](/docs/custom-layouts).

### `shouldRunLayouter` — `ShouldRunLayouter`

Predicate called when graph data changes. Return `true` to re-run the layout.

```ts
shouldRunLayouter={(prev, next) =>
  prev.graph.nodes.length !== next.graph.nodes.length
}
```

## Programmatic access

### `callbackFn` — `(data: NetiPlotCallbackData) => void`

Called after mount. Provides imperative access to the network. See [Programmatic access](/docs/api/callback).

### `identifier` — `string`

Stable string ID for this instance. Useful when multiple graphs are rendered on the same page.
