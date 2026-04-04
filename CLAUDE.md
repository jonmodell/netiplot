# revis-network-ts

## What This Is
A React-based canvas network visualization library. It renders nodes, edges, and shapes on layered HTML5 canvases with pan/zoom, drag, hover, and editing interactions. The primary export is a `<RevisNetwork>` component.

## Architecture

### Core Components
- **RevisNetwork.tsx** - Main orchestrator component. Manages state (pan/scale, interaction, hover), processes mouse/keyboard events, runs layout algorithms, and syncs graph data into internal Maps of RevisNode/RevisEdge instances.
- **Renderer.tsx** - Rendering engine. Runs a `requestAnimationFrame` loop at ~30fps across 4 stacked canvas layers (shapes, edges, nodes, hover). Uses styled-components for container CSS.
- **RevisNode.ts** - Node class with position, size, animation-to-destination, and canvas drawing (shapes, images, labels).
- **RevisEdge.ts** - Edge class with line/bezier rendering, arrowheads, labels, and hit-detection math.

### Rendering Layers
- **ActionLayer.tsx** - Transparent canvas capturing mouse/keyboard events. Uses `react-resize-detector` for responsive sizing.
- **EditLayer.tsx** - Canvas for shape selection handles (8 resize handles + bounding box).
- **HoverPopup.tsx** - React tooltip overlay, shown on hover with configurable delay.
- **ZoomControls.tsx** - Zoom in/out/fit-all/fit-selection button strip.

### State Management
Two custom hooks using `useReducer`:
- **usePanScale** - Pan position, zoom scale, animated zoom transitions.
- **useInteraction** - Current action (drag/pan/shape edit), dragged nodes, shape handle state.

### Layout System
- **layout/hierarchical.js** - Default hierarchical (tree) layout with UD/DU/LR/RL directions.
- **layout/utils.ts** - Ranking, ordering, positioning helpers for hierarchical layout.
- Custom layouters can be passed as props (e.g., d3-force, dagre-based).

### Types
All TypeScript interfaces in `src/types.ts`. Key types:
- `RevisGraph` = `{ nodes: RevisNodeDefinition[], edges: RevisEdgeDefinition[] }`
- `RevisShapeDefinition` - Background shapes with position/size/style
- `RevisOptions` - Nested config for nodes, edges, camera, layout, hover, interaction
- `RevisNetworkBaseProps` - All component props

## Build
- **Bundler**: Rollup (CJS + ESM output to `lib/`)
- **TypeScript**: strict mode, target ES5, JSX React
- **Entry**: `src/index.ts` exports only `RevisNetwork`

## Dependencies (runtime)
- `lodash` - merge, isEqual
- `ramda` - pipe, tap, mergeDeepRight (used in hooks)
- `react-resize-detector` - responsive canvas sizing
- `styled-components` - CSS-in-JS for Renderer container
- `uniqid` - unique ID generation

## Key Patterns
- Graph data is synced from props into `Map<string, RevisNode>` and `Map<string, RevisEdge>` refs
- Nodes animate toward destinations (layout positions) each frame
- Viewport culling skips off-screen nodes during render
- Custom drawing functions are passed through for nodes and shapes
- Many `@ts-ignore` comments indicate loose typing that needs cleanup

## Commands
```bash
npm run build        # Rollup build to lib/
npm run storybook    # Dev server (Storybook - being removed)
npm test             # Jest
```
