# @jonmodell/netiplot

A canvas-based network/graph visualization library with React and vanilla JS support. Render interactive node-edge graphs on layered HTML5 canvases with pan, zoom, drag, hover, and shape editing — with zero runtime dependencies.

**[Documentation & live examples →](https://netiplot.coda-fi.com/)**

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
  nodes: [{ id: 'a', label: 'Node A' }, { id: 'b', label: 'Node B' }],
  edges: [{ id: 'e1', from: 'a', to: 'b' }],
};

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '600px', overflow: 'hidden' }}>
      <NetiPlotReact graph={graph} />
    </div>
  );
}
```

### Vanilla JS

```ts
import { NetiPlot } from '@jonmodell/netiplot/vanilla';
import type { NetiPlotGraph } from '@jonmodell/netiplot';

const graph: NetiPlotGraph = {
  nodes: [{ id: 'a', label: 'Node A' }, { id: 'b', label: 'Node B' }],
  edges: [{ id: 'e1', from: 'a', to: 'b' }],
};

const net = new NetiPlot(document.getElementById('container')!, { graph });

net.setGraph(updatedGraph);
net.zoom('all');
net.destroy();
```

The container must have an explicit width and height. No stylesheet import is needed — styles are injected automatically.

## Documentation

Full documentation, API reference, and interactive examples are at **[netiplot.coda-fi.com](https://netiplot.coda-fi.com/)**.

Markdown reference docs are also available in [`docs/`](./docs/) for offline use and LLM context:

- [`docs/installation.md`](./docs/installation.md) — container setup, entry points
- [`docs/react.md`](./docs/react.md) — React component quickstart
- [`docs/vanilla.md`](./docs/vanilla.md) — Vanilla JS class API
- [`docs/api/props.md`](./docs/api/props.md) — `NetiPlotReact` props reference
- [`docs/api/options.md`](./docs/api/options.md) — `NetiPlotOptions` structure
- [`docs/api/graph.md`](./docs/api/graph.md) — node and edge definitions
- [`docs/api/events.md`](./docs/api/events.md) — mouse events
- [`docs/api/callback.md`](./docs/api/callback.md) — programmatic access
- [`docs/custom-drawing.md`](./docs/custom-drawing.md) — custom node/shape drawing
- [`docs/custom-layouts.md`](./docs/custom-layouts.md) — custom layout algorithms
- [`docs/shapes.md`](./docs/shapes.md) — background shapes
- [`docs/images.md`](./docs/images.md) — images and node icons

## Development

```bash
npm install
npm run dev          # vanilla demo (demo/)
npm run dev:react    # React/Next.js demo (demo-react/)
npm test
npm run build        # builds lib/ (React + vanilla entry points)
```

## License

MIT
