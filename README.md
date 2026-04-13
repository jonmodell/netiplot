# @jonmodell/netiplot

A canvas-based network/graph visualization library with React and vanilla JS support. Render interactive node-edge graphs on layered HTML5 canvases with pan, zoom, drag, hover, and shape editing — with zero runtime dependencies.

## Install

```bash
npm install @jonmodell/netiplot
```

## Usage

### React

```tsx
import { NetiPlotReact } from '@jonmodell/netiplot';
import type { NetiPlotGraph } from '@jonmodell/netiplot';

const graph: NetiPlotGraph = {
  nodes: [
    { id: 'a', label: 'Node A' },
    { id: 'b', label: 'Node B' },
  ],
  edges: [
    { id: 'e1', from: 'a', to: 'b' },
  ],
};

export default function App() {
  return <NetiPlotReact graph={graph} />;
}
```

### Vanilla JS

```ts
import { Netiplot } from '@jonmodell/netiplot/vanilla';

const net = new Netiplot(document.getElementById('container'), {
  graph: { nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ id: 'e1', from: 'a', to: 'b' }] },
  onMouse: (type, item) => console.log(type, item),
});

// Later:
net.setGraph(updatedGraph);
net.zoom('all');
net.destroy();
```

## React Props

| Prop | Type | Description |
|------|------|-------------|
| `graph` | `NetiPlotGraph` | Required. `{ nodes: NetiPlotNodeDefinition[], edges: NetiPlotEdgeDefinition[] }` |
| `shapes` | `NetiPlotShapeDefinition[]` | Background shapes rendered below the graph |
| `options` | `NetiPlotOptions` | Configuration for nodes, edges, camera, layout, hover, and interaction |
| `images` | `NetiPlotImageMap` | Map of image IDs to image elements for node icons |
| `layouter` | `NetiPlotLayouter` | Custom layout function (e.g. d3-force, dagre). Defaults to hierarchical. |
| `shouldRunLayouter` | `ShouldRunLayouter` | Predicate controlling when the layouter re-runs on data changes |
| `nodeDrawingFunction` | `NodeDrawingFunction` | Custom canvas drawing function for nodes |
| `shapeDrawingFunction` | `ShapeDrawingFunction` | Custom canvas drawing function for shapes |
| `onMouse` | `NetiPlotMouseHandler` | Mouse event callback |
| `callbackFn` | `(data: NetiPlotCallbackData) => void` | Provides programmatic access to the network (positions, camera, fit) |
| `customControls` | `(data: CustomControlsData) => ReactNode \| null` | Replace or hide the built-in zoom controls |
| `className` | `string` | CSS class for the container |
| `identifier` | `string` | Unique ID for the instance |

## Nodes

At minimum, nodes require a unique `id`. Supported properties:

```ts
{
  id: string;          // required
  label?: string;      // text label rendered with the node
  innerLabel?: string; // label inside the node shape
  image?: string;      // key into the `images` prop map
  shape?: string;      // passed to nodeDrawingFunction
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

Background shapes rendered on the lowest canvas layer, useful for grouping or annotating regions of the graph.

```ts
{
  shape: string;   // required
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

### React — pass a renderer via `options.hover`:

```tsx
options={{
  hover: {
    nodeRenderer: (node) => <div>{node.label}</div>,
    edgeRenderer: (edge) => <div>{edge.label}</div>,
    delay: 300,
    width: 200,
    height: 100,
  }
}}
```

### Vanilla — use the `hover` config (returns `HTMLElement | string`):

```ts
new Netiplot(el, {
  graph,
  hover: {
    nodeRenderer: (node) => `<b>${node.label}</b>`,
    delay: 300,
  },
});
```

## Images / Node Icons

```ts
const images = {
  server: { element: imgElement, scale: 0.5, offsetX: 0, offsetY: 0 },
};

// reference by key on any node:
{ id: 'n1', image: 'server' }
```

## Custom Layout

```ts
import type { NetiPlotLayouter } from '@jonmodell/netiplot';

const myLayouter: NetiPlotLayouter = (data, options, screen, onStopped) => {
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
  },
  edges: {
    showLabels: false,
    arrowheads: true,
    lineStyle: 'curved', // 'curved' | 'straight'
  },
  layoutOptions: {
    fitOnUpdate: true,
  },
  interaction: {
    allowGraphInteraction: true,
    allowShapeInteraction: false,
  },
}}
```

## Development

```bash
npm install
npm run dev          # vanilla demo (demo/)
npm run dev:react    # React/Next.js demo (demo-react/)
npm test
npm run build        # builds lib/ (React + vanilla entry points)
```
