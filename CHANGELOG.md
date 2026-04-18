# Changelog

## [2.0.3] - 2026-04-14

### Fixed
- **Runtime style injection** — the library now injects its required CSS into the document at runtime via `injectNetiPlotStyles()`. Consumers no longer need to import `@jonmodell/netiplot/styles` manually. The `./styles` export is still available for projects that prefer explicit control.

## [2.0.2] - 2026-04-13

### Fixed
- Added `"./styles": "./lib/netiplot.css"` to the package exports map so the stylesheet could be explicitly imported as `@jonmodell/netiplot/styles`.

## [2.0.1] - 2026-04-12

### Fixed
- Node dragging now correctly updates the rendered position (`node.x/y`) rather than the definition position (`definition.x/y`), which had diverged after layout ran.

## [2.0.0] - 2026-04-12

### Added
- **Vanilla JS entry point** — `import { NetiPlot } from '@jonmodell/netiplot/vanilla'`. Full class-based API with `setGraph()`, `setOptions()`, `zoom()`, `fit()`, `getCamera()`, `getNodePositions()`, and `destroy()`.
- Callback-based hover tooltips for vanilla (return `HTMLElement` or HTML string from `nodeRenderer`/`edgeRenderer`).
- New `demo/` directory — standalone Vite vanilla JS demo app.

### Changed
- **Breaking**: All public types and components renamed from `Revis*` / `RevisNetwork` to `NetiPlot*` / `NetiPlotReact`.
- Core engine extracted into framework-agnostic classes: `NetiPlotEngine`, `RenderLoop`, `EventManager`, `panScaleState`, `interactionState`.

### Fixed
- Eliminated infinite re-render loop when React consumers pass inline prop objects.
- Corrected tiered layout node ordering and coordinate assignment.
