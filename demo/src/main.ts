import { NetiPlot } from '@jonmodell/netiplot/vanilla';
import type {
  NetiPlotGraph,
  NetiPlotNodeDefinition,
  NetiPlotEdgeDefinition,
  NetiPlotShapeDefinition,
  NodeDrawingFunction,
} from '@jonmodell/netiplot';

// ── Helpers ───────────────────────────────────────────────────────────────────

const status = document.getElementById('status')!;
const container = document.getElementById('network-container')!;

function setStatus(msg: string) {
  status.textContent = msg;
}

function randomGraph(nodeCount: number): NetiPlotGraph {
  const types = ['server', 'client', 'router', 'switch', 'gateway'];
  const nodes: NetiPlotNodeDefinition[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: `n${i}`,
    label: `Node ${i}`,
    type: types[i % types.length],
    value: Math.random(),
  }));
  const edges: NetiPlotEdgeDefinition[] = [];
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

// ── Custom drawing functions ───────────────────────────────────────────────────

function makeNodeDrawer(style: string): NodeDrawingFunction {
  return (ctx, node) => {
    const size = (node.size || 30) / 2;
    const shape = style === 'mixed'
      ? (['circle', 'diamond', 'hexagon'] as const)[Math.abs(node.id.charCodeAt(1)) % 3]
      : style as 'circle' | 'diamond' | 'hexagon';

    // Color by type
    const colors: Record<string, string> = {
      server: '#6ee7f7', client: '#a78bfa', router: '#34d399',
      switch: '#fbbf24', gateway: '#f87171',
    };
    const fill = colors[node.type ?? ''] ?? '#888';

    ctx.fillStyle = fill;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * size, Math.sin(a) * size);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Label
    if (node.label) {
      ctx.fillStyle = '#111';
      ctx.font = `bold ${Math.max(8, size * 0.55)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(node.id).replace('n', ''), 0, 0);
    }
  };
}

// ── Shape interaction graph ───────────────────────────────────────────────────

function makeShapeGraph() {
  const graph: NetiPlotGraph = {
    nodes: [
      { id: 'a', label: 'Alpha', x: 100, y: 100 },
      { id: 'b', label: 'Beta',  x: 300, y: 200 },
      { id: 'c', label: 'Gamma', x: 200, y: 350 },
    ],
    edges: [
      { id: 'e1', from: 'a', to: 'b' },
      { id: 'e2', from: 'b', to: 'c' },
      { id: 'e3', from: 'c', to: 'a' },
    ],
  };
  const shapes: NetiPlotShapeDefinition[] = [
    { shape: 'rect', id: 's1', x: 50,  y: 50,  width: 200, height: 120,
      style: { fill: 'rgba(110,231,247,0.15)', stroke: '#6ee7f7', lineWidth: 1 } },
    { shape: 'rect', id: 's2', x: 250, y: 180, width: 180, height: 200,
      style: { fill: 'rgba(167,139,250,0.15)', stroke: '#a78bfa', lineWidth: 1 } },
  ];
  return { graph, shapes };
}

// ── Tooltip renderer ──────────────────────────────────────────────────────────

function tooltipRenderer(node: NetiPlotNodeDefinition): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = `<h4>${node.label ?? node.id}</h4><p>type: ${node.type ?? '—'}</p>`;
  return el;
}

// ── Scenario management ───────────────────────────────────────────────────────

let net: NetiPlot | null = null;
let addNodeCounter = 100;

function destroyCurrent() {
  net?.destroy();
  net = null;
}

// ─── Basic ───────────────────────────────────────────────────────────────────

function loadBasic() {
  destroyCurrent();
  addNodeCounter = 100;
  let graph = randomGraph(12);

  net = new NetiPlot(container, {
    graph,
    options: {
      interaction: { allowGraphInteraction: true },
      edges: { arrowheads: true },
      nodes: { showLabels: true, defaultSize: 30 },
    },
    onMouse: (type, item) => {
      if (type === 'nodeClick') setStatus(`clicked: ${(item as NetiPlotNodeDefinition)?.id ?? ''}`);
      if (type === 'backgroundClick') setStatus('');
    },
    hover: { delay: 400, width: 160, height: 80, nodeRenderer: tooltipRenderer },
  });

  document.getElementById('btn-add-basic')!.onclick = () => {
    const id = `n${addNodeCounter++}`;
    const parent = graph.nodes[Math.floor(Math.random() * graph.nodes.length)].id;
    graph = {
      nodes: [...graph.nodes, { id, label: `Node ${addNodeCounter - 1}` }],
      edges: [...graph.edges, { id: `e${id}`, from: parent, to: id }],
    };
    net?.setGraph(graph);
    setStatus(`added ${id}`);
  };
}

// ─── Options ─────────────────────────────────────────────────────────────────

function loadOptions() {
  destroyCurrent();

  const countEl   = document.getElementById('opt-count')   as HTMLInputElement;
  const sizeEl    = document.getElementById('opt-size')    as HTMLInputElement;
  const labelsEl  = document.getElementById('opt-labels')  as HTMLInputElement;
  const arrowsEl  = document.getElementById('opt-arrows')  as HTMLInputElement;
  const straightEl = document.getElementById('opt-straight') as HTMLInputElement;

  function buildOptions() {
    return {
      interaction: { allowGraphInteraction: true },
      nodes: { showLabels: labelsEl.checked, defaultSize: Number(sizeEl.value) },
      edges: {
        arrowheads: arrowsEl.checked,
        lineStyle: straightEl.checked ? 'straight' : 'curved',
        showLabels: false,
      },
    };
  }

  let graph = randomGraph(Number(countEl.value));
  net = new NetiPlot(container, {
    graph,
    options: buildOptions(),
    hover: { delay: 400, width: 160, height: 80, nodeRenderer: tooltipRenderer },
    onMouse: (type, item) => {
      if (type === 'nodeClick') setStatus(`clicked: ${(item as NetiPlotNodeDefinition)?.id ?? ''}`);
    },
  });

  function applyOptions() { net?.setOptions(buildOptions()); }

  countEl.onchange = () => {
    graph = randomGraph(Number(countEl.value));
    net?.setGraph(graph);
    net?.setOptions(buildOptions());
  };
  sizeEl.oninput = applyOptions;
  labelsEl.onchange = applyOptions;
  arrowsEl.onchange = applyOptions;
  straightEl.onchange = applyOptions;
}

// ─── Custom Drawing ───────────────────────────────────────────────────────────

function loadDrawing() {
  destroyCurrent();

  const styleEl = document.getElementById('draw-style') as HTMLSelectElement;
  const graph = randomGraph(18);

  net = new NetiPlot(container, {
    graph,
    options: {
      interaction: { allowGraphInteraction: true },
      nodes: { showLabels: false, defaultSize: 36 },
      edges: { arrowheads: true },
    },
    nodeDrawingFunction: makeNodeDrawer(styleEl.value),
    hover: { delay: 400, width: 160, height: 80, nodeRenderer: tooltipRenderer },
    onMouse: (type, item) => {
      if (type === 'nodeClick') setStatus(`${(item as NetiPlotNodeDefinition)?.type ?? 'node'} clicked`);
    },
  });

  styleEl.onchange = () => {
    // Recreate with new drawing function
    loadDrawing();
  };
}

// ─── Shape Interaction ────────────────────────────────────────────────────────

function loadShapes() {
  destroyCurrent();
  const { graph, shapes } = makeShapeGraph();

  net = new NetiPlot(container, {
    graph,
    shapes,
    options: {
      interaction: { allowShapeInteraction: true, allowGraphInteraction: false },
      nodes: { showLabels: true, defaultSize: 30 },
      edges: { arrowheads: true },
    },
    onMouse: (type, item) => {
      if (type === 'shapeClick')  setStatus('shape selected');
      if (type === 'shapeUpdate') setStatus('shape moved');
      if (type === 'backgroundClick') setStatus('');
    },
  });
}

// ─── Large Graph ──────────────────────────────────────────────────────────────

function loadLarge() {
  destroyCurrent();
  const countEl = document.getElementById('large-count') as HTMLInputElement;
  const labelEl = document.getElementById('large-count-label')!;

  function generate() {
    const count = Number(countEl.value);
    labelEl.textContent = String(count);
    const graph = randomGraph(count);
    if (net) {
      net.setGraph(graph);
    } else {
      net = new NetiPlot(container, {
        graph,
        options: {
          interaction: { allowGraphInteraction: true },
          nodes: { showLabels: false, defaultSize: 18 },
          edges: { arrowheads: false },
        },
        onMouse: (type) => { if (type === 'nodeClick') setStatus('node clicked'); },
      });
    }
    setStatus(`${count} nodes, ${graph.edges.length} edges`);
  }

  countEl.oninput = () => { labelEl.textContent = countEl.value; };
  document.getElementById('btn-gen-large')!.onclick = generate;
  generate();
}

// ── Tab switching ─────────────────────────────────────────────────────────────

const scenes: Record<string, () => void> = {
  basic:   loadBasic,
  options: loadOptions,
  drawing: loadDrawing,
  shapes:  loadShapes,
  large:   loadLarge,
};

document.getElementById('tabs')!.addEventListener('click', (e) => {
  const tab = (e.target as HTMLElement).closest('[data-scene]') as HTMLElement | null;
  if (!tab) return;
  const scene = tab.dataset.scene!;

  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');

  document.querySelectorAll('[id^="toolbar-"]').forEach((t) => {
    (t as HTMLElement).style.display = 'none';
  });
  const tb = document.getElementById(`toolbar-${scene}`);
  if (tb) tb.style.display = '';

  setStatus('');
  scenes[scene]?.();
});

// Wire zoom buttons (delegated — works for all toolbars)
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('[data-zoom]') as HTMLElement | null;
  if (btn && net) net.zoom(btn.dataset.zoom!);
});

// ── Boot ──────────────────────────────────────────────────────────────────────

loadBasic();
