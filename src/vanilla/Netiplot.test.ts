import { Netiplot } from './Netiplot';
import type { NetiPlotGraph, NetiPlotLayouter } from '../types';

// ── ResizeObserver mock ───────────────────────────────────────────────────────

let resizeCallback: (() => void) | null = null;

class MockResizeObserver {
  constructor(cb: () => void) { resizeCallback = cb; }
  observe = jest.fn();
  disconnect = jest.fn();
}

// ── RAF mock ──────────────────────────────────────────────────────────────────

type FrameEntry = { id: number; cb: FrameRequestCallback };
let pendingFrames: FrameEntry[] = [];
let cancelledIds = new Set<number>();
let rafIdCounter = 0;

// ── Canvas mock ───────────────────────────────────────────────────────────────

const mockCtx = {
  save: jest.fn(), restore: jest.fn(), clearRect: jest.fn(),
  transform: jest.fn(), translate: jest.fn(), beginPath: jest.fn(),
  closePath: jest.fn(), fill: jest.fn(), stroke: jest.fn(),
  fillRect: jest.fn(), drawImage: jest.fn(), rect: jest.fn(),
};

beforeAll(() => {
  (global as any).ResizeObserver = MockResizeObserver;
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    const id = ++rafIdCounter;
    pendingFrames.push({ id, cb });
    return id;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    cancelledIds.add(id);
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: jest.fn(() => mockCtx),
    configurable: true,
  });
});

beforeEach(() => {
  pendingFrames = [];
  cancelledIds = new Set();
  rafIdCounter = 0;
  resizeCallback = null;
  jest.clearAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockLayouter: NetiPlotLayouter = jest.fn(() => undefined);

const graph: NetiPlotGraph = {
  nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 100, y: 100 }],
  edges: [{ id: 'e1', from: 'a', to: 'b' }],
};

function makeContainer(): HTMLDivElement {
  return document.createElement('div');
}

// ── DOM setup ─────────────────────────────────────────────────────────────────

describe('Netiplot DOM setup', () => {
  it('creates 5 canvas elements inside the container', () => {
    const container = makeContainer();
    new Netiplot(container, { graph, layouter: mockLayouter });
    expect(container.querySelectorAll('canvas').length).toBe(5);
  });

  it('creates a tooltip div inside the container', () => {
    const container = makeContainer();
    new Netiplot(container, { graph, layouter: mockLayouter });
    expect(container.querySelector('.netiplot-tooltip')).not.toBeNull();
  });

  it('assigns expected class names to canvases', () => {
    const container = makeContainer();
    new Netiplot(container, { graph, layouter: mockLayouter });
    expect(container.querySelector('.netiplot-shapes')).not.toBeNull();
    expect(container.querySelector('.netiplot-edges')).not.toBeNull();
    expect(container.querySelector('.netiplot-nodes')).not.toBeNull();
    expect(container.querySelector('.netiplot-hover')).not.toBeNull();
    expect(container.querySelector('.netiplot-action')).not.toBeNull();
  });

  it('sets position:relative on a static container', () => {
    const container = makeContainer();
    // jsdom default computed position is 'static'
    new Netiplot(container, { graph, layouter: mockLayouter });
    expect(container.style.position).toBe('relative');
  });

  it('sets overflow:hidden on container', () => {
    const container = makeContainer();
    new Netiplot(container, { graph, layouter: mockLayouter });
    expect(container.style.overflow).toBe('hidden');
  });

  it('action canvas has tabIndex 0', () => {
    const container = makeContainer();
    new Netiplot(container, { graph, layouter: mockLayouter });
    const action = container.querySelector('.netiplot-action') as HTMLCanvasElement;
    expect(action.tabIndex).toBe(0);
  });
});

// ── Engine sync ───────────────────────────────────────────────────────────────

describe('engine sync', () => {
  it('engine nodes are populated from initial graph', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    expect((net as any).engine.nodes.size).toBe(2);
  });

  it('setGraph updates engine nodes', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    net.setGraph(graph);
    expect((net as any).engine.nodes.size).toBe(2);
  });

  it('setGraph returns this (chainable)', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    expect(net.setGraph(graph)).toBe(net);
  });

  it('setOptions returns this (chainable)', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    expect(net.setOptions({})).toBe(net);
  });
});

// ── Public API ────────────────────────────────────────────────────────────────

describe('public API', () => {
  it('getCamera returns pan/scale state', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    const cam = net.getCamera();
    expect(cam).toHaveProperty('scale');
    expect(cam).toHaveProperty('pan');
  });

  it('getNodePositions returns positions for all nodes', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    const pos = net.getNodePositions();
    expect(pos).toHaveProperty('a');
    expect(pos).toHaveProperty('b');
  });

  it('zoom returns this (chainable)', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    expect(net.zoom('in')).toBe(net);
  });

  it('fit returns this (chainable)', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    expect(net.fit()).toBe(net);
  });

  it('zoom delegates to engine', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    const spy = jest.spyOn((net as any).engine, 'zoom');
    net.zoom('all');
    expect(spy).toHaveBeenCalledWith('all');
  });

  it('fit delegates to engine.zoomToFit', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    const spy = jest.spyOn((net as any).engine, 'zoomToFit');
    net.fit();
    expect(spy).toHaveBeenCalled();
  });
});

// ── State change → markDirty ─────────────────────────────────────────────────

describe('engine subscription', () => {
  it('marks renderLoop dirty when engine state changes', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const spy = jest.spyOn((net as any).renderLoop, 'markDirty');
    net.setGraph(graph);
    expect(spy).toHaveBeenCalled();
  });
});

// ── Canvas dimension sync ─────────────────────────────────────────────────────

describe('canvas dimension sync', () => {
  it('syncs canvas dimensions when engine reports non-zero screen', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });

    // Manually trigger onEngineChange with a fake screen size
    const engine = (net as any).engine;
    engine['screen'] = { width: 800, height: 600, ratio: 1, boundingRect: null };
    engine['notify']();

    const shapes = container.querySelector('.netiplot-shapes') as HTMLCanvasElement;
    expect(shapes.width).toBe(800);
    expect(shapes.height).toBe(600);
  });

  it('skips dimension sync when screen dimensions are zero', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });

    const shapes = container.querySelector('.netiplot-shapes') as HTMLCanvasElement;
    const widthBefore = shapes.width;

    const engine = (net as any).engine;
    engine['screen'] = { width: 0, height: 0, ratio: 1, boundingRect: null };
    engine['notify']();

    expect(shapes.width).toBe(widthBefore);
  });
});

// ── Hover tooltip ─────────────────────────────────────────────────────────────

describe('hover tooltip', () => {
  it('shows tooltip with string content when node is hovered', () => {
    const container = makeContainer();
    const net = new Netiplot(container, {
      graph,
      layouter: mockLayouter,
      hover: { nodeRenderer: (n) => `<b>${n.id}</b>` },
    });

    const engine = (net as any).engine;
    engine['hover'] = {
      item: { id: 'a' },
      itemType: 'node',
      popupPosition: { x: 10, y: 20 },
    };
    engine['notify']();

    const tooltip = container.querySelector('.netiplot-tooltip') as HTMLDivElement;
    expect(tooltip.style.display).toBe('block');
    expect(tooltip.innerHTML).toContain('a');
  });

  it('shows tooltip with HTMLElement content', () => {
    const container = makeContainer();
    const net = new Netiplot(container, {
      graph,
      layouter: mockLayouter,
      hover: {
        nodeRenderer: (n) => {
          const el = document.createElement('span');
          el.textContent = n.id;
          return el;
        },
      },
    });

    const engine = (net as any).engine;
    engine['hover'] = { item: { id: 'b' }, itemType: 'node', popupPosition: { x: 0, y: 0 } };
    engine['notify']();

    const tooltip = container.querySelector('.netiplot-tooltip') as HTMLDivElement;
    expect(tooltip.style.display).toBe('block');
    expect(tooltip.textContent).toBe('b');
  });

  it('hides tooltip when hover is cleared', () => {
    const container = makeContainer();
    const net = new Netiplot(container, {
      graph,
      layouter: mockLayouter,
      hover: { nodeRenderer: (n) => n.id },
    });

    const engine = (net as any).engine;
    // Show first
    engine['hover'] = { item: { id: 'a' }, itemType: 'node', popupPosition: { x: 0, y: 0 } };
    engine['notify']();
    // Then clear
    engine['hover'] = { item: null, itemType: null };
    engine['notify']();

    const tooltip = container.querySelector('.netiplot-tooltip') as HTMLDivElement;
    expect(tooltip.style.display).toBe('none');
  });

  it('hides tooltip when no hoverConfig is provided', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });

    const engine = (net as any).engine;
    engine['hover'] = { item: { id: 'a' }, itemType: 'node', popupPosition: { x: 0, y: 0 } };
    engine['notify']();

    const tooltip = container.querySelector('.netiplot-tooltip') as HTMLDivElement;
    expect(tooltip.style.display).toBe('none');
  });

  it('positions tooltip at popupPosition', () => {
    const container = makeContainer();
    const net = new Netiplot(container, {
      graph,
      layouter: mockLayouter,
      hover: { nodeRenderer: () => 'hello' },
    });

    const engine = (net as any).engine;
    engine['hover'] = { item: { id: 'a' }, itemType: 'node', popupPosition: { x: 42, y: 99 } };
    engine['notify']();

    const tooltip = container.querySelector('.netiplot-tooltip') as HTMLDivElement;
    expect(tooltip.style.left).toBe('42px');
    expect(tooltip.style.top).toBe('99px');
  });
});

// ── Destroy ───────────────────────────────────────────────────────────────────

describe('destroy', () => {
  it('removes all canvases from container', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    net.destroy();
    expect(container.querySelectorAll('canvas').length).toBe(0);
  });

  it('removes tooltip from container', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    net.destroy();
    expect(container.querySelector('.netiplot-tooltip')).toBeNull();
  });

  it('stops the render loop', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    const spy = jest.spyOn((net as any).renderLoop, 'stop');
    net.destroy();
    expect(spy).toHaveBeenCalled();
  });

  it('destroys the event manager', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    const spy = jest.spyOn((net as any).eventManager, 'destroy');
    net.destroy();
    expect(spy).toHaveBeenCalled();
  });

  it('stops notifying after destroy', () => {
    const container = makeContainer();
    const net = new Netiplot(container, { graph, layouter: mockLayouter });
    const spy = jest.spyOn((net as any).renderLoop, 'markDirty');
    net.destroy();
    spy.mockClear();
    (net as any).engine['notify']();
    expect(spy).not.toHaveBeenCalled();
  });
});
