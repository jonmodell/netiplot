# @jonmodell/netiplot

A React canvas-based network/graph visualization library. Render interactive node-edge graphs on layered HTML5 canvases with pan, zoom, drag, hover, and shape editing — with zero runtime dependencies.

## Install

```bash
npm install @jonmodell/netiplot
```

## Basic Usage

```tsx
import { RevisNetwork } from '@jonmodell/netiplot';
import type { RevisGraph } from '@jonmodell/netiplot';

const graph: RevisGraph = {
  nodes: [
    { id: 'a', label: 'Node A' },
    { id: 'b', label: 'Node B' },
  ],
  edges: [
    { id: 'e1', from: 'a', to: 'b' },
  ],
};

export default function App() {
  return <RevisNetwork graph={graph} />;
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `graph` | `RevisGraph` | Required. `{ nodes: RevisNodeDefinition[], edges: RevisEdgeDefinition[] }` |
| `shapes` | `RevisShapeDefinition[]` | Background shapes rendered below the graph |
| `options` | `RevisOptions` | Configuration for nodes, edges, camera, layout, hover, and interaction |
| `images` | `RevisImageMap` | Map of image IDs to image elements for node icons |
| `layouter` | `RevisLayouter` | Custom layout function (e.g. d3-force, dagre). Defaults to hierarchical. |
| `shouldRunLayouter` | `ShouldRunLayouter` | Predicate controlling when the layouter re-runs on data changes |
| `nodeDrawingFunction` | `NodeDrawingFunction` | Custom canvas drawing function for nodes |
| `shapeDrawingFunction` | `ShapeDrawingFunction` | Custom canvas drawing function for shapes |
| `onMouse` | `RevisMouseHandler` | Mouse event callback |
| `callbackFn` | `(data: RevisCallbackData) => void` | Provides programmatic access to the network (positions, camera, fit) |
| `customControls` | `(data: CustomControlsData) => ReactNode \| null` | Replace or hide the built-in zoom controls |
| `className` | `string` | CSS class for the container |
| `identifier` | `string` | Unique ID for the instance |
| `debug` | `boolean` | Enable debug mode |

## Nodes

At minimum, nodes require a unique `id`. Supported properties:

```ts
{
  id: string;          // required
  label?: string;      // text label rendered with the node
  innerLabel?: string; // label inside the node shape
  image?: string;      // key into the `images` prop map
  shape?: string;      // 'circle' | 'square' | 'diamond' | 'hexagon'
  size?: number;
  fixed?: boolean;     // exclude from layout
  x?: number;          // manual position
  y?: number;
  style?: {
    background?: string;
    border?: string;
    size?: number;
  };
}
```

Custom properties can be added freely and accessed in a `nodeDrawingFunction`.

## Edges

```ts
{
  id: string;      // required
  from: string;    // source node id
  to: string;      // target node id
  label?: string;
  size?: number;
  style?: {
    color?: string;
    lineWidth?: number;
    font?: string;
    fontColor?: string;
  };
}
```

## Shapes

Background shapes rendered on the lowest canvas layer. Useful for grouping or annotating regions of the graph.

```ts
{
  shape: string;   // required: 'circle' | 'square' | 'diamond' | 'hexagon' | etc.
  x: number;       // required
  y: number;       // required
  width?: number;
  height?: number;
  size?: number;
  visible?: boolean;
  noEdit?: boolean;
  noClick?: boolean;
  style?: {
    background?: string;
    border?: string;
    lineWidth?: number;
  };
}
```

## Mouse Events

The `onMouse` callback receives all interaction events:

```ts
onMouse={(type, item, event) => {
  // type: 'nodeClick' | 'nodeDblClick' | 'nodesDragged' |
  //       'edgeClick' | 'edgeDblClick' |
  //       'shapeClick' | 'shapeDblClick' | 'shapeUpdate' |
  //       'backgroundClick'
}}
```

## Hover Tooltip

Pass a renderer via `options.hover` to show a React component on node or edge hover:

```tsx
options={{
  hover: {
    nodeRenderer: (node) => <div>{node.label}</div>,
    edgeRenderer: (edge) => <div>{edge.label}</div>,
    delay: 300,   // ms
    width: 200,
    height: 100,
  }
}}
```

## Images / Node Icons

Supply a map of image entries to the `images` prop and reference them by key in node definitions:

```ts
const images = {
  server: { element: imgElement, scale: 0.5, offsetX: 0, offsetY: 0 },
};

// then on a node:
{ id: 'n1', image: 'server' }
```

## Custom Layout

Pass any function matching the `RevisLayouter` signature:

```ts
import type { RevisLayouter } from '@jonmodell/netiplot';

const myLayouter: RevisLayouter = (data, options, screen, onStopped) => {
  const { nodeMap } = data;
  // position nodes by setting node.destination = { x, y }
  onStopped?.();
};
```

Return an object with a `stop()` method for async layouts (e.g. force simulations).

## Options

```ts
options={{
  nodes: {
    showLabels: true,
    defaultSize: 30,
    nodeFillStyle: '#4a90e2',
  },
  edges: {
    showLabels: false,
    arrowheads: true,
    lineStyle: 'solid',
  },
  layoutOptions: {
    fitOnUpdate: true,
  },
  interaction: {
    allowGraphInteraction: true,
    allowShapeInteraction: true,
  },
}}
```

## Development

```bash
npm install       # install dependencies
npm run dev       # start demo app
npm test          # run tests
npm run build     # build library to lib/
```
