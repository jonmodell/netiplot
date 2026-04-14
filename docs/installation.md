# Installation

```bash
npm install @jonmodell/netiplot
```

## Entry points

```ts
import { NetiPlotReact } from '@jonmodell/netiplot'           // React component
import { NetiPlot } from '@jonmodell/netiplot/vanilla'        // Vanilla JS class
```

No stylesheet import is required — styles are injected automatically at runtime.

## Container setup

`<NetiPlotReact>` renders absolutely-positioned canvases that fill their containing block. The wrapping element must have `position: relative`, a non-zero computed height, and `overflow: hidden`.

```tsx
{/* Fixed height */}
<div style={{ position: 'relative', width: '100%', height: '600px', overflow: 'hidden' }}>
  <NetiPlotReact graph={graph} />
</div>

{/* Flex-fill — parent must be a flex column with a defined height */}
<div className="flex-1 relative overflow-hidden">
  <NetiPlotReact graph={graph} />
</div>
```

Do **not** add an extra `absolute inset-0` wrapper — the component already fills its container.
