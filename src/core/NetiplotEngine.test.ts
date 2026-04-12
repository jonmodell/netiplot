import { NetiplotEngine } from './NetiplotEngine';
import type { RevisGraph, RevisLayouter } from '../types';

const graph: RevisGraph = {
  nodes: [
    { id: 'a', x: 0, y: 0 },
    { id: 'b', x: 100, y: 100 },
  ],
  edges: [{ id: 'e1', from: 'a', to: 'b' }],
};

const mockLayouter: jest.MockedFunction<RevisLayouter> = jest.fn(() => undefined);

function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'clientWidth', { value: width, configurable: true });
  Object.defineProperty(canvas, 'clientHeight', { value: height, configurable: true });
  canvas.getBoundingClientRect = () =>
    ({
      width,
      height,
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      toJSON: () => ({}),
    } as DOMRect);
  return canvas;
}

beforeEach(() => {
  mockLayouter.mockClear();
});

// ── Construction ──────────────────────────────────────────────────────────────

describe('NetiplotEngine construction', () => {
  it('initializes with default pan/scale state', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const state = engine.getState();
    expect(state.panScale.scale).toBe(0.1);
    expect(state.panScale.pan).toEqual({ x: 300, y: 300 });
    expect(state.panScale.destinationScale).toBeNull();
  });

  it('initializes with null interaction action', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    expect(engine.getState().interaction.action).toBeNull();
  });

  it('syncs graph nodes and edges on construction', () => {
    const engine = new NetiplotEngine({ graph, layouter: mockLayouter });
    expect(engine.nodes.size).toBe(2);
    expect(engine.edges.size).toBe(1);
  });

  it('does not call layouter for empty graph', () => {
    new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    expect(mockLayouter).not.toHaveBeenCalled();
  });

  it('calls layouter when graph has nodes', () => {
    new NetiplotEngine({ graph, layouter: mockLayouter });
    expect(mockLayouter).toHaveBeenCalledTimes(1);
  });

  it('assigns a uid', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    expect(engine.uid).toMatch(/^netiplot-/);
  });

  it('uses provided identifier as uid', () => {
    const engine = new NetiplotEngine({
      graph: { nodes: [], edges: [] },
      layouter: mockLayouter,
      identifier: 'my-net',
    });
    expect(engine.uid).toBe('my-net');
  });
});

// ── Subscribe / notify ────────────────────────────────────────────────────────

describe('subscribe / notify', () => {
  it('notifies subscriber when state changes', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const canvas = createMockCanvas();
    engine.handleResize(canvas);
    const listener = jest.fn();
    engine.subscribe(listener);
    engine.zoom('in');
    expect(listener).toHaveBeenCalled();
  });

  it('unsubscribe stops notifications', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const listener = jest.fn();
    const unsub = engine.subscribe(listener);
    unsub();
    engine['dispatchPanScale']({ type: 'pan', payload: { x: 1, y: 1 } });
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const a = jest.fn();
    const b = jest.fn();
    engine.subscribe(a);
    engine.subscribe(b);
    engine['dispatchPanScale']({ type: 'pan', payload: { x: 1, y: 1 } });
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });
});

// ── Graph sync ────────────────────────────────────────────────────────────────

describe('setGraph', () => {
  it('adds new nodes', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    engine.setGraph(graph);
    expect(engine.nodes.size).toBe(2);
  });

  it('adds new edges', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    engine.setGraph(graph);
    expect(engine.edges.size).toBe(1);
  });

  it('runs layout when nodes are added', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    engine.setGraph(graph);
    expect(mockLayouter).toHaveBeenCalled();
  });

  it('removes nodes no longer in graph', () => {
    const engine = new NetiplotEngine({ graph, layouter: mockLayouter });
    engine.setGraph({ nodes: [{ id: 'a', x: 0, y: 0 }], edges: [] });
    expect(engine.nodes.size).toBe(1);
    expect(engine.nodes.has('b')).toBe(false);
  });

  it('does not run layout when graph is unchanged', () => {
    const engine = new NetiplotEngine({ graph, layouter: mockLayouter });
    mockLayouter.mockClear();
    // Same definition objects — no diff
    engine.setGraph(graph);
    expect(mockLayouter).not.toHaveBeenCalled();
  });

  it('updates shapes', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const shapes = [{ shape: 'rect', x: 0, y: 0, width: 100, height: 50 }];
    engine.setGraph({ nodes: [], edges: [] }, shapes);
    expect(engine.getState().shapes).toEqual(shapes);
  });
});

// ── Camera ────────────────────────────────────────────────────────────────────

describe('getCamera / getNodePositions', () => {
  it('getCamera returns current pan/scale', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const camera = engine.getCamera();
    expect(camera.scale).toBe(0.1);
    expect(camera.pan).toEqual({ x: 300, y: 300 });
  });

  it('getNodePositions returns empty object for empty graph', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    expect(engine.getNodePositions()).toEqual({});
  });

  it('getNodePositions returns positions for all nodes', () => {
    const engine = new NetiplotEngine({ graph, layouter: mockLayouter });
    const positions = engine.getNodePositions();
    expect(positions['a']).toBeDefined();
    expect(positions['b']).toBeDefined();
  });
});

// ── Resize ────────────────────────────────────────────────────────────────────

describe('handleResize', () => {
  it('returns false for null canvas', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    expect(engine.handleResize(null)).toBe(false);
  });

  it('updates screen state', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const canvas = createMockCanvas(1024, 768);
    engine.handleResize(canvas);
    const screen = engine.getState().screen;
    expect(screen.width).toBe(1024);
    expect(screen.height).toBe(768);
  });

  it('notifies subscribers on resize', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const listener = jest.fn();
    engine.subscribe(listener);
    engine.handleResize(createMockCanvas());
    expect(listener).toHaveBeenCalled();
  });
});

// ── Key handling ──────────────────────────────────────────────────────────────

describe('handleKey', () => {
  it('sets keyAction on keydown', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    engine.handleKey(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(engine.getState().keyAction).toBe('_moveUp');
  });

  it('clears keyAction on keyup', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    engine.handleKey(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    engine.handleKey(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
    expect(engine.getState().keyAction).toBeNull();
  });

  it('returns false for defaultPrevented events', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const e = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    Object.defineProperty(e, 'defaultPrevented', { value: true });
    expect(engine.handleKey(e)).toBe(false);
  });
});

// ── Tick ──────────────────────────────────────────────────────────────────────

describe('tick', () => {
  it('applies keyAction to panScale', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    engine.handleKey(new KeyboardEvent('keydown', { key: '1' }));
    engine.tick();
    expect(engine.getState().panScale.scale).toBe(1);
  });

  it('animates zoomPanimate toward destination', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    engine['dispatchPanScale']({
      type: 'set',
      payload: {
        scale: 1,
        pan: { x: 0, y: 0 },
        destinationScale: 2,
        destinationPan: { x: 100, y: 100 },
        panPerFrame: null,
      },
    });
    engine.tick();
    expect(engine.getState().panScale.scale).toBeGreaterThan(1);
    expect(engine.getState().panScale.scale).toBeLessThan(2);
  });

  it('does nothing when no active animation', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const before = engine.getState().panScale;
    engine.tick();
    expect(engine.getState().panScale).toEqual(before);
  });
});

// ── Zoom ──────────────────────────────────────────────────────────────────────

describe('zoom', () => {
  it('zoom in sets destinationScale above current', () => {
    const engine = new NetiplotEngine({ graph, layouter: mockLayouter });
    engine.handleResize(createMockCanvas());
    engine['dispatchPanScale']({
      type: 'set',
      payload: { ...engine.getState().panScale, scale: 1 },
    });
    engine.zoom('in');
    expect(engine.getState().panScale.destinationScale).toBeGreaterThan(1);
  });

  it('zoom out sets destinationScale below current', () => {
    const engine = new NetiplotEngine({ graph, layouter: mockLayouter });
    engine.handleResize(createMockCanvas());
    engine['dispatchPanScale']({
      type: 'set',
      payload: { ...engine.getState().panScale, scale: 3 },
    });
    engine.zoom('out');
    expect(engine.getState().panScale.destinationScale).toBeLessThan(3);
  });

  it('zoom all calls zoomToFit and sets destination', () => {
    const engine = new NetiplotEngine({ graph, layouter: mockLayouter });
    engine.handleResize(createMockCanvas());
    engine.zoom('all');
    expect(engine.getState().panScale.destinationScale).toBeDefined();
  });

  it('zoom selection uses first dragged node', () => {
    const engine = new NetiplotEngine({ graph, layouter: mockLayouter });
    engine.handleResize(createMockCanvas());
    engine['dispatchInteraction']({ type: 'addToDrag', payload: [{ id: 'a', x: 50, y: 60 }] });
    engine.zoom('selection');
    expect(engine.getState().panScale.destinationScale).toBe(2);
  });
});

// ── onMouse callback ──────────────────────────────────────────────────────────

describe('onMouse callbacks', () => {
  it('fires backgroundClick on mouseup with no dragged nodes', () => {
    const onMouse = jest.fn();
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter, onMouse });
    engine.handleResize(createMockCanvas());
    // mouseup with no dragged nodes, no mouse movement, no edgeDown
    engine['processMouseAction']('mouseup', {
      pos: { x: -9999, y: -9999 },
      ctrlClick: false,
      e: new MouseEvent('mouseup'),
    });
    expect(onMouse).toHaveBeenCalledWith('backgroundClick', null, expect.any(MouseEvent));
  });

  it('fires nodeClick when clicking a node', () => {
    const onMouse = jest.fn();
    const engine = new NetiplotEngine({ graph, layouter: mockLayouter, onMouse });
    engine.handleResize(createMockCanvas());
    // Node 'a' is at x:0, y:0 — click at that position
    engine['processMouseAction']('mousedown', {
      pos: { x: 0, y: 0 },
      ctrlClick: false,
      e: new MouseEvent('mousedown'),
    });
    expect(onMouse).toHaveBeenCalledWith('nodeClick', expect.objectContaining({ id: 'a' }), expect.any(MouseEvent));
  });
});

// ── Destroy ───────────────────────────────────────────────────────────────────

describe('destroy', () => {
  it('stops notifying listeners after destroy', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    const listener = jest.fn();
    engine.subscribe(listener);
    engine.destroy();
    engine['notify']();
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops a stoppable layout result on destroy', () => {
    const stop = jest.fn();
    const stoppableLayouter: RevisLayouter = jest.fn(() => ({ stop }));
    const engine = new NetiplotEngine({ graph, layouter: stoppableLayouter });
    engine.destroy();
    expect(stop).toHaveBeenCalled();
  });

  it('handles null canvas gracefully', () => {
    const engine = new NetiplotEngine({ graph: { nodes: [], edges: [] }, layouter: mockLayouter });
    expect(() => engine.destroy()).not.toThrow();
  });
});
