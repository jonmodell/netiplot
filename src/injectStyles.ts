/**
 * Injects the netiplot CSS into the document head at runtime.
 * Called automatically when the React component or vanilla class is first used,
 * so consumers do not need to manually import the stylesheet.
 *
 * The function is idempotent (guarded by a data attribute) and SSR-safe
 * (no-ops when `document` is not available).
 */

const STYLE_ID = 'netiplot-styles';

const NETIPLOT_CSS = `
.netiplot-container {
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.netiplot-container canvas {
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.netiplot-container canvas:focus {
  outline: none;
}

.netiplot-container canvas.editing {
  background: rgba(250, 250, 250, 0.3);
}

.netiplot-container .controls {
  display: block;
  position: absolute;
  top: 10px;
  right: 10px;
  width: 39px;
}

.netiplot-container .controls .control-button {
  position: relative;
  height: 36px;
  width: 36px;
  opacity: 0.7;
}

.netiplot-container .controls .control-button:hover {
  opacity: 0.9;
}

.netiplot-container .controls button {
  background: none;
  padding: 0;
  margin: 1px 0;
  border: none;
}

.netiplot-container .controls button:focus {
  outline: 0;
}

.netiplot-container .node-detail {
  display: block;
  position: relative;
}
`;

export function injectNetiPlotStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = NETIPLOT_CSS;
  document.head.appendChild(style);
}
