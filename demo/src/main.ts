import { Netiplot } from '@jonmodell/netiplot/vanilla';
import type { RevisGraph, RevisNodeDefinition, RevisEdgeDefinition } from '@jonmodell/netiplot';

// ── Graph generators ──────────────────────────────────────────────────────────

function makeGraph(nodeCount: number): RevisGraph {
  const nodes: RevisNodeDefinition[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: `n${i}`,
    label: `Node ${i}`,
    type: i % 3 === 0 ? 'server' : i % 3 === 1 ? 'client' : 'router',
  }));

  const edges: RevisEdgeDefinition[] = [];
  // Create a spanning tree so every node is connected
  for (let i = 1; i < nodeCount; i++) {
    const parent = Math.floor(Math.random() * i);
    edges.push({ id: `e${i}`, from: `n${parent}`, to: `n${i}`, label: '' });
  }
  // Add a few extra cross-links
  const extras = Math.min(nodeCount, 5);
  for (let i = 0; i < extras; i++) {
    const a = Math.floor(Math.random() * nodeCount);
    const b = Math.floor(Math.random() * nodeCount);
    if (a !== b) {
      edges.push({ id: `ex${i}`, from: `n${a}`, to: `n${b}` });
    }
  }

  return { nodes, edges };
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const container = document.getElementById('network-container')!;
const status = document.getElementById('status')!;

let nodeCounter = 100;
let currentGraph = makeGraph(10);

const net = new Netiplot(container, {
  graph: currentGraph,
  options: {
    interaction: { allowGraphInteraction: true },
    edges: { arrowheads: true, showLabels: false },
    nodes: { showLabels: true, defaultSize: 30 },
  },
  onMouse: (type, item) => {
    if (type === 'nodeClick')      status.textContent = `clicked: ${(item as RevisNodeDefinition)?.id}`;
    if (type === 'backgroundClick') status.textContent = '';
  },
  hover: {
    delay: 400,
    width: 160,
    height: 80,
    nodeRenderer: (node) => {
      const el = document.createElement('div');
      el.innerHTML = `<h4>${node.label ?? node.id}</h4><p>type: ${node.type ?? '—'}</p>`;
      return el;
    },
  },
});

// ── Toolbar wiring ────────────────────────────────────────────────────────────

document.getElementById('btn-zoom-in')!  .addEventListener('click', () => net.zoom('in'));
document.getElementById('btn-zoom-out')! .addEventListener('click', () => net.zoom('out'));
document.getElementById('btn-fit')!      .addEventListener('click', () => net.fit());
document.getElementById('btn-fit-sel')!  .addEventListener('click', () => net.zoom('selection'));

function loadGraph(count: number) {
  currentGraph = makeGraph(count);
  net.setGraph(currentGraph);
  status.textContent = `${count} nodes loaded`;
}

document.getElementById('btn-small')!  .addEventListener('click', () => loadGraph(5));
document.getElementById('btn-medium')! .addEventListener('click', () => loadGraph(20));
document.getElementById('btn-large')!  .addEventListener('click', () => loadGraph(50));

document.getElementById('btn-add')!.addEventListener('click', () => {
  const newId = `n${nodeCounter++}`;
  const parentId = currentGraph.nodes[Math.floor(Math.random() * currentGraph.nodes.length)]?.id ?? 'n0';
  currentGraph = {
    nodes: [...currentGraph.nodes, { id: newId, label: `Node ${nodeCounter - 1}` }],
    edges: [...currentGraph.edges, { id: `e${newId}`, from: parentId, to: newId }],
  };
  net.setGraph(currentGraph);
  status.textContent = `added ${newId}`;
});
