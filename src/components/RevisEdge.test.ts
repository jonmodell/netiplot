import { RevisNode } from './RevisNode';
import { RevisEdge } from './RevisEdge';
import type { RevisOptions } from '../types';

const opts: RevisOptions = {};

function makeNode(id: string, x: number, y: number): RevisNode {
  const n = new RevisNode(id, { id, x, y }, opts);
  n.x = x;
  n.y = y;
  return n;
}

function makeEdge(fromNode: RevisNode, toNode: RevisNode, dup = 0): RevisEdge {
  return new RevisEdge('e1', { id: 'e1', from: fromNode.id, to: toNode.id }, toNode, fromNode, dup);
}

describe('RevisEdge constructor', () => {
  it('stores id, definition, start, end', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    expect(e.id).toBe('e1');
    expect(e.start).toBe(n1);
    expect(e.end).toBe(n2);
    expect(e.definition.from).toBe('n1');
    expect(e.definition.to).toBe('n2');
  });

  it('defaults dupNumber to 0', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    expect(e.dupNumber).toBe(0);
  });

  it('stores dupNumber when provided', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2, 2);
    expect(e.dupNumber).toBe(2);
  });
});

describe('RevisEdge destroy', () => {
  it('sets delete flag', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    e.destroy();
    expect(e.delete).toBe(true);
  });
});

describe('RevisEdge update', () => {
  it('replaces definition', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    const newDef = { id: 'e1', from: 'n1', to: 'n2', label: 'updated' };
    e.update(newDef);
    expect(e.definition.label).toBe('updated');
  });
});

describe('RevisEdge getControlPoint', () => {
  it('returns (0,0) when start or end is missing', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
(e as any).start = null;
    expect(e.getControlPoint()).toEqual({ x: 0, y: 0 });
  });

  it('returns a point offset from end for dup=0', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 50);
    const e = makeEdge(n1, n2, 0);
    const cp = e.getControlPoint();
    // dup=0 so offset = 0*20 = 0 → same as end coords
    expect(cp).toEqual({ x: 100, y: 0 });
  });

  it('offsets control point for dup>0', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 50);
    const e = makeEdge(n1, n2, 1);
    const cp0 = new RevisEdge('e0', { id: 'e0', from: 'n1', to: 'n2' }, n2, n1, 0).getControlPoint();
    const cp1 = e.getControlPoint();
    expect(cp1.x).not.toBe(cp0.x);
  });
});

describe('RevisEdge getDistanceFrom', () => {
  it('returns null when start or end is missing', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
(e as any).start = null;
    expect(e.getDistanceFrom({ x: 50, y: 0 }, {})).toBeNull();
  });

  it('returns small distance for point near a straight edge', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    const dist = e.getDistanceFrom({ x: 50, y: 2 }, { lineStyle: 'straight' });
    expect(dist).not.toBeNull();
    expect(dist!).toBeLessThan(5);
  });

  it('returns large distance for point far from edge', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    const dist = e.getDistanceFrom({ x: 50, y: 500 }, { lineStyle: 'straight' });
    expect(dist!).toBeGreaterThan(100);
  });
});

describe('RevisEdge getQuadraticXY', () => {
  it('returns a point on the curve between start and end at coef=0.5', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    // coef=0.5, horizontal edge → t adjusted for diffRatio, but result is between start/end
    const pt = e.getQuadraticXY(0.5, 0, 0, 50, 0, 100, 0);
    expect(pt.x).toBeGreaterThan(0);
    expect(pt.x).toBeLessThan(100);
    expect(pt.y).toBeCloseTo(0);
  });

  it('returns same y for a horizontal edge at any coef', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    // cp.y === start.y === end.y === 0 → all y are 0
    const pt = e.getQuadraticXY(0.3, 0, 0, 50, 0, 100, 0);
    expect(pt.y).toBeCloseTo(0);
  });
});

describe('RevisEdge render', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      fillText: jest.fn(),
      createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: 'center',
    } as unknown as CanvasRenderingContext2D;
  });

  const state = {
    scale: 1,
    options: { edges: { lineStyle: 'curved', showLabels: false, arrowheads: false } },
    rolloverItem: null,
  };

  it('returns false when start or end is missing', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
(e as any).start = null;
    expect(e.render(state, ctx)).toBe(false);
  });

  it('returns true for valid edge', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 50);
    const e = makeEdge(n1, n2);
    expect(e.render(state, ctx)).toBe(true);
  });

  it('draws a straight line for lineStyle=straight and dupNumber=0', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2, 0);
    const straightState = { ...state, options: { edges: { lineStyle: 'straight', showLabels: false, arrowheads: false } } };
    e.render(straightState, ctx);
    expect((ctx.lineTo as jest.Mock)).toHaveBeenCalled();
    expect((ctx.quadraticCurveTo as jest.Mock)).not.toHaveBeenCalled();
  });

  it('draws a curve when lineStyle is not straight', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 50);
    const e = makeEdge(n1, n2, 0);
    e.render(state, ctx);
    expect((ctx.quadraticCurveTo as jest.Mock)).toHaveBeenCalled();
  });

  it('draws arrowhead when arrowheads option is true', () => {
    const n1 = makeNode('n1', 0, 0);
    const n2 = makeNode('n2', 100, 0);
    const e = makeEdge(n1, n2, 0);
    const arrowState = { ...state, options: { edges: { lineStyle: 'curved', showLabels: false, arrowheads: true } } };
    e.render(arrowState, ctx);
    // arrowhead draws multiple moveTo/lineTo calls after the edge
    expect((ctx.fill as jest.Mock).mock.calls.length).toBeGreaterThan(0);
  });

  it('skips render when start===end position', () => {
    const n1 = makeNode('n1', 50, 50);
    const n2 = makeNode('n2', 50, 50); // same position
    const e = makeEdge(n1, n2, 0);
    expect(e.render(state, ctx)).toBe(true);
    // stroke should not have been called since same-position check returns early
    expect((ctx.stroke as jest.Mock)).not.toHaveBeenCalled();
  });
});
