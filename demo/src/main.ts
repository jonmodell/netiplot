import { NetiPlot } from '@jonmodell/netiplot/vanilla';
import type {
  NetiPlotGraph,
  NetiPlotNodeDefinition,
  NetiPlotShapeDefinition,
  NodeDrawingFunction,
  ShapeDrawingFunction,
  NetiPlotImageMap,
} from '@jonmodell/netiplot';

// Examples shared with the React demo (imported via @examples alias in vite.config.ts)
import basicStyledWithIcons from '@examples/data/basicStyledWithIcons.js';
import { iconMap as nodeIconMap } from '@examples/data/images.js';
import makeNodeShape from '@examples/drawing/nodeDrawing.js';
import shapeDrawingFn from '@examples/drawing/shapeDrawing.js';
import { iconMap as drawingIconMap, data as drawingData, shapes as drawingShapes } from '@examples/drawing/index.js';
import tieredDecorations from '@examples/layouts/tieredDecorator/shapes.js';
import tieredNodeDrawing from '@examples/layouts/tieredDecorator/nodeDrawing.js';
import tieredShapeDrawing from '@examples/layouts/tieredDecorator/shapeDrawing.js';
import tieredLayout from './tieredLayout';
import randomData from '@examples/data/random.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusEl = document.getElementById('status')!;
const container = document.getElementById('network-container')!;

const setStatus = (msg: string) => { statusEl.textContent = msg; };

function randomGraph(nodeCount: number): NetiPlotGraph {
  const types = ['server', 'client', 'router', 'switch', 'gateway'];
  const nodes: NetiPlotNodeDefinition[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: `n${i}`, label: `Node ${i}`, type: types[i % types.length], value: Math.random(),
  }));
  const edges: { id: string; from: string; to: string }[] = [];
  for (let i = 1; i < nodeCount; i++) {
    edges.push({ id: `e${i}`, from: `n${Math.floor(Math.random() * i)}`, to: `n${i}` });
  }
  const extras = Math.min(nodeCount, 8);
  for (let i = 0; i < extras; i++) {
    const a = Math.floor(Math.random() * nodeCount);
    const b = Math.floor(Math.random() * nodeCount);
    if (a !== b) edges.push({ id: `ex${i}`, from: `n${a}`, to: `n${b}` });
  }
  return { nodes, edges };
}

function tooltipRenderer(node: NetiPlotNodeDefinition): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = `<h4>${node.label ?? node.id}</h4><p>type: ${node.type ?? 'node'}</p>`;
  return el;
}

// ── Scenario state ────────────────────────────────────────────────────────────

let net: NetiPlot | null = null;
let addNodeCounter = 100;
const destroyCurrent = () => { net?.destroy(); net = null; };

// ── 1. Basic ──────────────────────────────────────────────────────────────────

function loadBasic() {
  destroyCurrent();
  addNodeCounter = 100;
  let graph = randomGraph(12);
  net = new NetiPlot(container, {
    graph,
    options: { interaction: { allowGraphInteraction: true }, edges: { arrowheads: true }, nodes: { showLabels: true, defaultSize: 30 } },
    hover: { delay: 400, width: 160, height: 80, nodeRenderer: tooltipRenderer },
    onMouse: (type, item) => {
      if (type === 'nodeClick') setStatus(`clicked: ${(item as NetiPlotNodeDefinition)?.id ?? ''}`);
      if (type === 'backgroundClick') setStatus('');
    },
  });
  document.getElementById('btn-add-basic')!.onclick = () => {
    const id = `n${addNodeCounter++}`;
    const parent = graph.nodes[Math.floor(Math.random() * graph.nodes.length)].id;
    graph = { nodes: [...graph.nodes, { id, label: `Node ${addNodeCounter - 1}` }], edges: [...graph.edges, { id: `e${id}`, from: parent, to: id }] };
    net?.setGraph(graph);
    setStatus(`added ${id}`);
  };
}

// ── 2. Options ────────────────────────────────────────────────────────────────

function loadOptions() {
  destroyCurrent();
  const countEl = document.getElementById('opt-count') as HTMLInputElement;
  const sizeEl = document.getElementById('opt-size') as HTMLInputElement;
  const labelsEl = document.getElementById('opt-labels') as HTMLInputElement;
  const arrowsEl = document.getElementById('opt-arrows') as HTMLInputElement;
  const straightEl = document.getElementById('opt-straight') as HTMLInputElement;
  const buildOptions = () => ({
    interaction: { allowGraphInteraction: true },
    nodes: { showLabels: labelsEl.checked, defaultSize: Number(sizeEl.value) },
    edges: { arrowheads: arrowsEl.checked, lineStyle: straightEl.checked ? 'straight' : 'curved', showLabels: false },
  });
  let graph = randomGraph(Number(countEl.value));
  net = new NetiPlot(container, {
    graph, options: buildOptions(),
    hover: { delay: 400, width: 160, height: 80, nodeRenderer: tooltipRenderer },
    onMouse: (type, item) => { if (type === 'nodeClick') setStatus(`clicked: ${(item as NetiPlotNodeDefinition)?.id ?? ''}`); },
  });
  const applyOptions = () => net?.setOptions(buildOptions());
  countEl.onchange = () => { graph = randomGraph(Number(countEl.value)); net?.setGraph(graph); applyOptions(); };
  sizeEl.oninput = applyOptions;
  labelsEl.onchange = applyOptions;
  arrowsEl.onchange = applyOptions;
  straightEl.onchange = applyOptions;
}

// ── 3. Icons & Labels ─────────────────────────────────────────────────────────

function loadIcons() {
  destroyCurrent();
  net = new NetiPlot(container, {
    graph: basicStyledWithIcons as NetiPlotGraph,
    images: nodeIconMap as NetiPlotImageMap,
    nodeDrawingFunction: makeNodeShape as NodeDrawingFunction,
    options: {
      interaction: { allowGraphInteraction: true },
      nodes: { showLabels: true, defaultSize: 50 },
      edges: { arrowheads: true, showLabels: true },
    },
    hover: { delay: 400, width: 200, height: 100, nodeRenderer: tooltipRenderer },
    onMouse: (type, item) => {
      if (type === 'nodeClick') setStatus(`clicked: ${(item as NetiPlotNodeDefinition)?.label ?? ''}`);
      if (type === 'backgroundClick') setStatus('');
    },
  });
}

// ── 4. Shape Drawing ──────────────────────────────────────────────────────────

function loadShapeDrawing() {
  destroyCurrent();
  let editShapes = false;
  let shapes: NetiPlotShapeDefinition[] = [...(drawingShapes as NetiPlotShapeDefinition[])];

  net = new NetiPlot(container, {
    graph: drawingData as NetiPlotGraph,
    shapes,
    images: drawingIconMap as NetiPlotImageMap,
    nodeDrawingFunction: makeNodeShape as NodeDrawingFunction,
    shapeDrawingFunction: shapeDrawingFn as ShapeDrawingFunction,
    options: {
      interaction: { allowGraphInteraction: true, allowShapeInteraction: false },
      nodes: { defaultSize: 60 }, edges: { lineStyle: 'straight' },
    },
    hover: { delay: 400, width: 160, height: 80, nodeRenderer: tooltipRenderer },
  });

  const toggleEl = document.getElementById('sd-toggle') as HTMLInputElement;
  toggleEl.checked = false;
  toggleEl.onchange = () => {
    editShapes = toggleEl.checked;
    net?.setOptions({ interaction: { allowGraphInteraction: !editShapes, allowShapeInteraction: editShapes } });
    setStatus(editShapes ? 'Shape editing on — drag to move, handles to resize' : '');
  };

  const addShape = (type: string) => {
    const base: any = { id: `s${Date.now()}`, x: 10, y: 10 };
    const defs: Record<string, any> = {
      rectangle: { width: 150, height: 100, shape: 'rectangle', style: { fill: '#4488cc', line: '#222', lineWidth: 1 } },
      square:    { size: 100, shape: 'square',    style: { fill: '#44cc88', line: '#222', lineWidth: 1 } },
      circle:    { size: 100, shape: 'circle',    style: { fill: '#cc4488', line: '#222', lineWidth: 1 } },
      ellipse:   { width: 150, height: 100, shape: 'ellipse',  style: { fill: '#8844cc', line: '#222', lineWidth: 1 } },
      cloud:     { width: 200, height: 120, shape: 'cloud',    style: { fill: '#ee4455', line: '#33ee33', lineWidth: 1 } },
      hexagon:   { size: 100, shape: 'hexagon',  style: { fill: '#cc8811', line: '#222', lineWidth: 1 } },
      polygon:   { size: 100, shape: 'polygon', faces: 8, style: { fill: '#cc8811', line: '#33ee33', lineWidth: 1 } },
      text:      { width: 300, height: 60, shape: 'text', text: 'Hello World', fontSize: 18, textAlign: 'left', background: true, style: { fill: '#d3429e' } },
      line:      { width: 200, height: 0,  shape: 'line',     style: { line: '#222', lineWidth: 2 } },
    };
    shapes = [...shapes, { ...base, ...defs[type] }];
    net?.setGraph(drawingData as NetiPlotGraph, shapes);
    setStatus(`added ${type}`);
  };

  (['rect', 'square', 'circle', 'ellipse', 'cloud', 'hex', 'poly', 'text', 'line'] as const).forEach((k) => {
    const map: Record<string, string> = { rect: 'rectangle', square: 'square', circle: 'circle', ellipse: 'ellipse', cloud: 'cloud', hex: 'hexagon', poly: 'polygon', text: 'text', line: 'line' };
    document.getElementById(`sd-${k}`)!.onclick = () => addShape(map[k]);
  });

  document.getElementById('sd-delete')!.onclick = () => {
    if (!shapes.length) return;
    shapes = shapes.slice(0, -1);
    net?.setGraph(drawingData as NetiPlotGraph, shapes);
    setStatus('deleted last shape');
  };
  document.getElementById('sd-color')!.onclick = () => {
    if (!shapes.length) return;
    const hex = `#${((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0')}`;
    shapes = shapes.map((s, i) => i === shapes.length - 1 ? { ...s, style: { ...(s.style || {}), fill: hex, background: hex } } : s);
    net?.setGraph(drawingData as NetiPlotGraph, shapes);
  };
}

// ── 5. Custom Drawing ─────────────────────────────────────────────────────────

type DrawStyle = 'circle' | 'diamond' | 'hexagon' | 'mixed';

function makeCustomNodeDrawer(style: DrawStyle): NodeDrawingFunction {
  return (ctx, node) => {
    const size = (node.size || 30) / 2;
    const shape = style === 'mixed'
      ? (['circle', 'diamond', 'hexagon'] as const)[Math.abs(node.id.charCodeAt(1)) % 3] : style;
    const colors: Record<string, string> = { server: '#6ee7f7', client: '#a78bfa', router: '#34d399', switch: '#fbbf24', gateway: '#f87171' };
    ctx.fillStyle = colors[node.type ?? ''] ?? '#888'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    if (shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else if (shape === 'diamond') { ctx.beginPath(); ctx.moveTo(0,-size); ctx.lineTo(size,0); ctx.lineTo(0,size); ctx.lineTo(-size,0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); for (let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6;ctx[i===0?'moveTo':'lineTo'](Math.cos(a)*size,Math.sin(a)*size);} ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (node.label) { ctx.fillStyle='#111'; ctx.font=`bold ${Math.max(8,size*0.55)}px system-ui`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(node.id).replace('n',''),0,0); }
  };
}

function loadDrawing() {
  destroyCurrent();
  const styleEl = document.getElementById('draw-style') as HTMLSelectElement;
  const graph = randomGraph(18);
  net = new NetiPlot(container, {
    graph,
    options: { interaction: { allowGraphInteraction: true }, nodes: { showLabels: false, defaultSize: 36 }, edges: { arrowheads: true } },
    nodeDrawingFunction: makeCustomNodeDrawer(styleEl.value as DrawStyle),
    hover: { delay: 400, width: 160, height: 80, nodeRenderer: tooltipRenderer },
    onMouse: (type, item) => { if (type === 'nodeClick') setStatus(`${(item as NetiPlotNodeDefinition)?.type ?? 'node'} clicked`); },
  });
  styleEl.onchange = () => loadDrawing();
}

// ── 6. Shape Interaction ──────────────────────────────────────────────────────

function loadShapeInteraction() {
  destroyCurrent();
  const graph: NetiPlotGraph = {
    nodes: [{ id: 'a', label: 'Alpha', x: 100, y: 100 }, { id: 'b', label: 'Beta', x: 300, y: 200 }, { id: 'c', label: 'Gamma', x: 200, y: 350 }],
    edges: [{ id: 'e1', from: 'a', to: 'b' }, { id: 'e2', from: 'b', to: 'c' }, { id: 'e3', from: 'c', to: 'a' }],
  };
  const shapes: NetiPlotShapeDefinition[] = [
    { shape: 'rect', id: 's1', x: 50, y: 50, width: 200, height: 120, style: { fill: 'rgba(110,231,247,0.15)', stroke: '#6ee7f7', lineWidth: 1 } },
    { shape: 'rect', id: 's2', x: 250, y: 180, width: 180, height: 200, style: { fill: 'rgba(167,139,250,0.15)', stroke: '#a78bfa', lineWidth: 1 } },
  ];
  net = new NetiPlot(container, {
    graph, shapes,
    options: { interaction: { allowShapeInteraction: true, allowGraphInteraction: false }, nodes: { showLabels: true, defaultSize: 30 }, edges: { arrowheads: true } },
    onMouse: (type) => { if (type==='shapeClick') setStatus('shape selected'); if (type==='shapeUpdate') setStatus('shape moved'); if (type==='backgroundClick') setStatus(''); },
  });
}

// ── 7. Tiered Layout ─────────────────────────────────────────────────────────

function loadTiered() {
  destroyCurrent();
  const hEl = document.getElementById('tiered-h') as HTMLInputElement;
  const vEl = document.getElementById('tiered-v') as HTMLInputElement;
  const dEl = document.getElementById('tiered-d') as HTMLInputElement;
  const shapes: NetiPlotShapeDefinition[] = (tieredDecorations as any[]).map((s: any) => ({ ...s }));

  net = new NetiPlot(container, {
    graph: randomData(50) as NetiPlotGraph,
    shapes,
    images: drawingIconMap as NetiPlotImageMap,
    layouter: tieredLayout as any,
    nodeDrawingFunction: tieredNodeDrawing as NodeDrawingFunction,
    shapeDrawingFunction: tieredShapeDrawing as ShapeDrawingFunction,
    options: { layoutOptions: { horizontalNodeSpacing: Number(hEl.value), verticalNodeSpacing: Number(vEl.value), decoratorSpacing: Number(dEl.value) } },
    onMouse: (type, item) => { if (type==='nodeClick') setStatus(`${(item as NetiPlotNodeDefinition)?.label??''} — ${(item as any)?.type??''}`); },
  });

  const applyLayout = () => net?.setOptions({ layoutOptions: { horizontalNodeSpacing: Number(hEl.value), verticalNodeSpacing: Number(vEl.value), decoratorSpacing: Number(dEl.value) } });
  hEl.onchange = applyLayout; vEl.onchange = applyLayout; dEl.onchange = applyLayout;
}

// ── 8. Large Graph ────────────────────────────────────────────────────────────

function loadLarge() {
  destroyCurrent();
  const countEl = document.getElementById('large-count') as HTMLInputElement;
  const labelEl = document.getElementById('large-count-label')!;
  const borderColors: Record<string, string> = {
    server: '#3b82f6', client: '#8b5cf6', router: '#10b981', switch: '#f59e0b', gateway: '#ef4444',
  };
  const generate = () => {
    const count = Number(countEl.value);
    labelEl.textContent = String(count);
    const graph = randomGraph(count);
    graph.nodes.forEach(n => { n.style = { border: borderColors[n.type ?? ''] ?? '#888', lineWidth: 3 }; });
    if (net) { net.setGraph(graph); }
    else { net = new NetiPlot(container, { graph, options: { interaction: { allowGraphInteraction: true }, nodes: { showLabels: false, defaultSize: 70,  }, edges: { arrowheads: false } }, onMouse: () => {} }); }
    setStatus(`${count} nodes, ${graph.edges.length} edges`);
  };
  countEl.oninput = () => { labelEl.textContent = countEl.value; };
  document.getElementById('btn-gen-large')!.onclick = generate;
  generate();
}

// ── Tab switching ─────────────────────────────────────────────────────────────

const scenes: Record<string, () => void> = { basic: loadBasic, options: loadOptions, icons: loadIcons, shapedrawing: loadShapeDrawing, drawing: loadDrawing, shapes: loadShapeInteraction, tiered: loadTiered, large: loadLarge };

document.getElementById('tabs')!.addEventListener('click', (e) => {
  const tab = (e.target as HTMLElement).closest('[data-scene]') as HTMLElement | null;
  if (!tab) return;
  const scene = tab.dataset.scene!;
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');
  document.querySelectorAll('[id^="toolbar-"]').forEach((t) => { (t as HTMLElement).style.display = 'none'; });
  const tb = document.getElementById(`toolbar-${scene}`);
  if (tb) tb.style.display = '';
  setStatus('');
  scenes[scene]?.();
});

document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('[data-zoom]') as HTMLElement | null;
  if (btn && net) net.zoom(btn.dataset.zoom!);
});

loadBasic();
