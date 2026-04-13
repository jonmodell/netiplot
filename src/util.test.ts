import {
  checkNodeAtPosition,
  getBounds,
  getBoundsScale,
  getEdgeAtPosition,
  getFitToScreen,
  getHandleAtPos,
  getHoverPos,
  getKeyAction,
  getMousePos,
  getNodeAtPosition,
  getNodePositions,
  getNodeScreenPos,
  getPanScaleFromMouseWheel,
  getScreenEdgePan,
  getShapeAtPos,
  inViewPort,
  setShapeByHandleDrag,
  deepEqual,
  deepMerge,
} from './util';
import { NetiPlotNode } from './components/NetiPlotNode';
import { NetiPlotEdge } from './components/NetiPlotEdge';
import type { Bounds, PanScaleState, NetiPlotOptions, NetiPlotScreen, NetiPlotShapeDefinition } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultPanScale: PanScaleState = {
  scale: 1,
  pan: { x: 0, y: 0 },
  destinationPan: null,
  destinationScale: null,
  panPerFrame: null,
};

const defaultScreen: NetiPlotScreen = {
  width: 800,
  height: 600,
  ratio: 1,
  boundingRect: { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) } as DOMRect,
};

const defaultOptions: NetiPlotOptions = {};

function makeNode(id: string, x: number, y: number, size = 30): NetiPlotNode {
  const n = new NetiPlotNode(id, { id, x, y, size }, defaultOptions);
  n.x = x;
  n.y = y;
  n.bSize = size;
  return n;
}

function makeEdge(id: string, fromNode: NetiPlotNode, toNode: NetiPlotNode): NetiPlotEdge {
  return new NetiPlotEdge(id, { id, from: fromNode.id, to: toNode.id }, toNode, fromNode, 0);
}

// ─── getScreenEdgePan ────────────────────────────────────────────────────────

describe('getScreenEdgePan', () => {
  const sc: NetiPlotScreen = {
    ...defaultScreen,
    boundingRect: { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) } as DOMRect,
  };

  it('returns null when cursor is in the middle', () => {
    expect(getScreenEdgePan(sc, { clientX: 400, clientY: 300 })).toBeNull();
  });

  it('returns positive x when near left edge', () => {
    const r = getScreenEdgePan(sc, { clientX: 5, clientY: 300 });
    expect(r).not.toBeNull();
    expect(r!.x).toBeGreaterThan(0);
  });

  it('returns negative x when near right edge', () => {
    const r = getScreenEdgePan(sc, { clientX: 795, clientY: 300 });
    expect(r).not.toBeNull();
    expect(r!.x).toBeLessThan(0);
  });

  it('returns positive y when near top edge', () => {
    const r = getScreenEdgePan(sc, { clientX: 400, clientY: 5 });
    expect(r).not.toBeNull();
    expect(r!.y).toBeGreaterThan(0);
  });

  it('returns null when screen has no boundingRect', () => {
    expect(getScreenEdgePan({ ...sc, boundingRect: null }, { clientX: 5, clientY: 5 })).toBeNull();
  });
});

// ─── getNodeScreenPos ────────────────────────────────────────────────────────

describe('getNodeScreenPos', () => {
  it('applies pan and scale', () => {
    const pos = getNodeScreenPos({ x: 100, y: 50 }, { ...defaultPanScale, scale: 2, pan: { x: 10, y: 20 } });
    expect(pos).toEqual({ x: 210, y: 120 });
  });
});

// ─── getHoverPos ─────────────────────────────────────────────────────────────

describe('getHoverPos', () => {
  it('puts hover to the right when in left half of screen', () => {
    const pos = getHoverPos({ x: 100, y: 100 }, defaultScreen, defaultPanScale, defaultOptions);
    expect(pos.x).toBe(100); // left of center → no offset
  });

  it('puts hover to the left when in right half of screen', () => {
    const pos = getHoverPos({ x: 600, y: 100 }, defaultScreen, defaultPanScale, defaultOptions);
    expect(pos.x).toBe(600 - (defaultOptions.hover?.width || 200));
  });
});

// ─── checkNodeAtPosition ─────────────────────────────────────────────────────

describe('checkNodeAtPosition', () => {
  const node = { x: 100, y: 100, bSize: 30 };

  it('returns true for position inside node bounds', () => {
    expect(checkNodeAtPosition(node, { x: 100, y: 100 })).toBe(true);
  });

  it('returns false for position outside node bounds', () => {
    expect(checkNodeAtPosition(node, { x: 200, y: 200 })).toBe(false);
  });
});

// ─── getNodeAtPosition ───────────────────────────────────────────────────────

describe('getNodeAtPosition', () => {
  it('returns the node at a given position', () => {
    const n = makeNode('a', 100, 100, 30);
    const map = new Map([['a', n]]);
    expect(getNodeAtPosition(map, { x: 100, y: 100 })).toBe(n);
  });

  it('returns null when no node is at the position', () => {
    const n = makeNode('a', 100, 100, 30);
    const map = new Map([['a', n]]);
    expect(getNodeAtPosition(map, { x: 500, y: 500 })).toBeNull();
  });
});

// ─── getBounds ───────────────────────────────────────────────────────────────

describe('getBounds', () => {
  it('returns default bounds when no nodes or shapes', () => {
    const b = getBounds();
    expect(b).toMatchObject({ minX: 0, minY: 0, maxX: 100, maxY: 100 });
  });

  it('encompasses all node positions', () => {
    const n1 = makeNode('a', 0, 0);
    const n2 = makeNode('b', 200, 150);
    const b = getBounds([n1, n2]);
    expect(b.maxX).toBeGreaterThanOrEqual(200);
    expect(b.maxY).toBeGreaterThanOrEqual(150);
    expect(b.minX).toBeLessThanOrEqual(0);
  });

  it('incorporates shapes that are not boundsIgnore', () => {
    const shape: NetiPlotShapeDefinition = { shape: 'rect', x: 500, y: 400, width: 50, height: 50 };
    const b = getBounds([], [shape]);
    expect(b.maxX).toBeGreaterThanOrEqual(550);
    expect(b.maxY).toBeGreaterThanOrEqual(450);
  });

  it('ignores shapes with boundsIgnore set', () => {
    const shape: NetiPlotShapeDefinition = { shape: 'rect', x: 9999, y: 9999, width: 50, height: 50, boundsIgnore: true };
    const b = getBounds([], [shape]);
    expect(b.maxX).toBeLessThan(9000);
  });
});

// ─── getBoundsScale ──────────────────────────────────────────────────────────

describe('getBoundsScale', () => {
  it('fits the smaller dimension', () => {
    const bounds: Bounds = { minX: 0, minY: 0, maxX: 100, maxY: 200, width: 100, height: 200 };
    const scale = getBoundsScale(400, 800, bounds, defaultOptions);
    // height is limiting: 400 / (200 + 60) ≈ 1.538
    expect(scale).toBeCloseTo(400 / (200 + 60), 2);
  });
});

// ─── getFitToScreen ──────────────────────────────────────────────────────────

describe('getFitToScreen', () => {
  it('returns null for falsy bounds', () => {
    expect(getFitToScreen(null as unknown as Bounds, defaultScreen, 10, defaultOptions)).toBeNull();
  });

  it('returns a pan and scale', () => {
    const bounds: Bounds = { minX: 0, minY: 0, maxX: 200, maxY: 150, width: 200, height: 150 };
    const result = getFitToScreen(bounds, defaultScreen, 10, defaultOptions);
    expect(result).toHaveProperty('scale');
    expect(result).toHaveProperty('pan');
    expect(result!.scale).toBeGreaterThan(0);
  });
});

// ─── getMousePos ─────────────────────────────────────────────────────────────

describe('getMousePos', () => {
  it('returns offscreen when no boundingRect', () => {
    const e = { clientX: 100, clientY: 100 } as MouseEvent;
    const pos = getMousePos(e, { ...defaultScreen, boundingRect: null }, defaultPanScale);
    expect(pos).toEqual({ x: -1000, y: -1000 });
  });

  it('applies bounding rect and pan/scale', () => {
    const e = { clientX: 100, clientY: 50 } as MouseEvent;
    const pos = getMousePos(e, defaultScreen, { ...defaultPanScale, scale: 2, pan: { x: 0, y: 0 } });
    expect(pos).toEqual({ x: 50, y: 25 });
  });
});

// ─── getNodePositions ────────────────────────────────────────────────────────

describe('getNodePositions', () => {
  it('returns a map of id to x/y', () => {
    const n = makeNode('abc', 42, 99);
    const map = new Map([['abc', n]]);
    expect(getNodePositions(map)).toEqual({ abc: { x: 42, y: 99 } });
  });
});

// ─── getKeyAction ────────────────────────────────────────────────────────────

describe('getKeyAction', () => {
  it('maps ArrowUp to _moveUp', () => {
    expect(getKeyAction('ArrowUp')).toBe('_moveUp');
  });

  it('maps ] to _zoomIn', () => {
    expect(getKeyAction(']')).toBe('_zoomIn');
  });

  it('returns null for unmapped keys', () => {
    expect(getKeyAction('a')).toBeNull();
  });
});

// ─── getShapeAtPos ───────────────────────────────────────────────────────────

describe('getShapeAtPos', () => {
  const shapes: NetiPlotShapeDefinition[] = [
    { shape: 'rect', x: 0, y: 0, width: 100, height: 100 },
    { shape: 'rect', x: 200, y: 200, width: 50, height: 50 },
  ];

  it('returns the shape that contains the position (last-on-top order)', () => {
    const result = getShapeAtPos(shapes, { x: 50, y: 50 });
    expect(result).toBe(shapes[0]);
  });

  it('returns false when no shape contains the position', () => {
    expect(getShapeAtPos(shapes, { x: 999, y: 999 })).toBe(false);
  });

  it('returns false for undefined shapes', () => {
    expect(getShapeAtPos(undefined, { x: 50, y: 50 })).toBe(false);
  });

  it('respects noClick', () => {
    const noClickShapes: NetiPlotShapeDefinition[] = [{ shape: 'rect', x: 0, y: 0, width: 100, height: 100, noClick: true }];
    expect(getShapeAtPos(noClickShapes, { x: 50, y: 50 })).toBe(false);
  });
});

// ─── inViewPort ──────────────────────────────────────────────────────────────

describe('inViewPort', () => {
  const vp = { left: 0, top: 0, right: 100, bottom: 100 };

  it('returns true for item inside viewport', () => {
    expect(inViewPort({ x: 50, y: 50 }, vp)).toBe(true);
  });

  it('returns false for item outside viewport', () => {
    expect(inViewPort({ x: 200, y: 200 }, vp)).toBe(false);
  });
});

// ─── getHandleAtPos ──────────────────────────────────────────────────────────

describe('getHandleAtPos', () => {
  const shape: NetiPlotShapeDefinition = { shape: 'rect', x: 100, y: 100, width: 100, height: 80 };

  it('returns undefined when not near any handle', () => {
    expect(getHandleAtPos(shape, { x: 150, y: 140 }, 1)).toBeUndefined();
  });

  it('returns a handle id when near a handle', () => {
    // tl handle: l = x - handleSize*2 + offset = 100 - 16 + 4 = 88, t = y - handleSize - offset = 88
    // center of handle = (92, 92), size=8
    const handle = getHandleAtPos(shape, { x: 92, y: 92 }, 1);
    expect(handle).toBe('tl');
  });
});

// ─── setShapeByHandleDrag ────────────────────────────────────────────────────

describe('setShapeByHandleDrag', () => {
  const shape: NetiPlotShapeDefinition = { shape: 'rect', x: 100, y: 100, width: 200, height: 150 };

  it('br handle increases width and height', () => {
    const r = setShapeByHandleDrag(shape, 'br', { x: 10, y: 10 }, false);
    expect(r.width).toBe(210);
    expect(r.height).toBe(160);
    expect(r.x).toBe(100);
    expect(r.y).toBe(100);
  });

  it('tl handle decreases size and moves origin', () => {
    const r = setShapeByHandleDrag(shape, 'tl', { x: 10, y: 10 }, false);
    expect(r.width).toBe(190);
    expect(r.height).toBe(140);
    expect(r.x).toBe(110);
    expect(r.y).toBe(110);
  });

  it('ctrl constrains width and height to the smaller value', () => {
    const r = setShapeByHandleDrag(shape, 'br', { x: 50, y: 10 }, true);
    expect(r.width).toBe(r.height);
  });

  it('enforces minimum shape size', () => {
    const r = setShapeByHandleDrag(shape, 'ml', { x: 1000, y: 0 }, false);
    expect(r.width).toBeGreaterThanOrEqual(10);
  });
});

// ─── getPanScaleFromMouseWheel ───────────────────────────────────────────────

describe('getPanScaleFromMouseWheel', () => {
  it('zooms in when deltaY is negative', () => {
    const e = { clientX: 400, clientY: 300, deltaY: -100 } as WheelEvent;
    const result = getPanScaleFromMouseWheel(e, defaultPanScale, defaultScreen, getBounds(), defaultOptions);
    expect(result.scale).toBeGreaterThan(defaultPanScale.scale);
  });

  it('zooms out when deltaY is positive', () => {
    const e = { clientX: 400, clientY: 300, deltaY: 100 } as WheelEvent;
    const state = { ...defaultPanScale, scale: 2 };
    const result = getPanScaleFromMouseWheel(e, state, defaultScreen, getBounds(), defaultOptions);
    expect(result.scale).toBeLessThan(2);
  });
});

// ─── deepMerge ───────────────────────────────────────────────────────────────

describe('deepMerge', () => {
  it('merges nested objects', () => {
    const a = { x: { a: 1, b: 2 } };
    const b = { x: { b: 3, c: 4 } };
    expect(deepMerge(a, b)).toEqual({ x: { a: 1, b: 3, c: 4 } });
  });

  it('does not mutate source objects', () => {
    const a = { x: 1 };
    const b = { y: 2 };
    deepMerge(a, b);
    expect(a).toEqual({ x: 1 });
  });

  it('handles empty target', () => {
    const result = deepMerge({}, { a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('later sources override earlier sources', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });
});

// ─── deepEqual ───────────────────────────────────────────────────────────────

describe('deepEqual', () => {
  it('returns true for equal primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
  });

  it('returns false for different primitives', () => {
    expect(deepEqual(1, 2)).toBe(false);
  });

  it('returns true for deeply equal objects', () => {
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
  });

  it('returns false for objects with different values', () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('returns true for equal arrays', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('returns false for arrays of different length', () => {
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('handles null correctly', () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });
});

// ─── getEdgeAtPosition ───────────────────────────────────────────────────────

describe('getEdgeAtPosition', () => {
  it('returns null when map is empty', () => {
    expect(getEdgeAtPosition(new Map(), { x: 50, y: 50 }, {})).toBeNull();
  });

  it('returns an edge close to the query point', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge('e1', n1, n2);
    const map = new Map([['e1', e]]);
    // midpoint of horizontal edge at (50, 0) — straight line
    const result = getEdgeAtPosition(map, { x: 50, y: 2 }, { lineStyle: 'straight' });
    expect(result).toBe(e);
  });
});
