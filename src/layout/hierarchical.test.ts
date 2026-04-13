import hierarchical from './hierarchical';
import {
  assignCoords,
  assignEdgeParentChild,
  compareByMass,
  compareByOrder,
  compareByParentChild,
  getBounds,
  getCoordsKeyValuePairs,
  getNodeBounds,
  getWidth,
  scaleCoords,
  scaleCoordsByScreenSize,
  shouldAssignCoords,
} from './utils';
import { NetiPlotNode } from '../components/NetiPlotNode';
import { NetiPlotEdge } from '../components/NetiPlotEdge';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

const TEST_SCREEN = { width: 800, height: 600 };

// Build a nodeMap + edgeMap and run the layouter.
// Uses fixed spacing (not screen-relative) for deterministic positions.
function runLayout(
  nodeDefs: { id: string; mass?: number }[],
  edgePairs: [string, string][],
  extraOptions: Record<string, unknown> = {},
) {
  const nodeMap = new Map<string, NetiPlotNode>();
  for (const def of nodeDefs) {
    const n = new NetiPlotNode(def.id, { id: def.id }, {});
    if (def.mass !== undefined) (n as any).mass = def.mass;
    nodeMap.set(def.id, n);
  }

  const edgeMap = new Map<string, NetiPlotEdge>();
  edgePairs.forEach(([from, to], i) => {
    const id = `e${i}`;
    edgeMap.set(
      id,
      new NetiPlotEdge(id, { id, from, to }, nodeMap.get(to)!, nodeMap.get(from)!, 0),
    );
  });

  hierarchical(
    { nodeMap, edgeMap },
    {
      isDirected: true,
      spaceNodesByScreenSize: false,
      horizontalNodeSpacing: 100,
      verticalNodeSpacing: 200,
      ...extraOptions,
    },
    TEST_SCREEN,
  );

  return nodeMap;
}

// After layout, positions land in node.destination (node had x=0,y=0 already set).
function pos(nodeMap: Map<string, NetiPlotNode>, id: string) {
  const n = nodeMap.get(id)!;
  return n.destination ?? { x: n.x, y: n.y };
}

// ─── Direction: UD (Up-Down, default) ────────────────────────────────────────

describe('hierarchical layout – UD direction (top-to-bottom)', () => {
  it('root node is placed above its child', () => {
    const nodes = runLayout([{ id: 'root' }, { id: 'child' }], [['root', 'child']]);
    expect(pos(nodes, 'child').y).toBeGreaterThan(pos(nodes, 'root').y);
  });

  it('root, child, and grandchild have increasing Y values', () => {
    const nodes = runLayout(
      [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
      [['A', 'B'], ['B', 'C']],
    );
    const yA = pos(nodes, 'A').y;
    const yB = pos(nodes, 'B').y;
    const yC = pos(nodes, 'C').y;
    expect(yB).toBeGreaterThan(yA);
    expect(yC).toBeGreaterThan(yB);
  });

  it('two siblings share the same Y as each other, both below parent', () => {
    const nodes = runLayout(
      [{ id: 'P' }, { id: 'C1' }, { id: 'C2' }],
      [['P', 'C1'], ['P', 'C2']],
    );
    const yP = pos(nodes, 'P').y;
    const yC1 = pos(nodes, 'C1').y;
    const yC2 = pos(nodes, 'C2').y;
    expect(yC1).toBeGreaterThan(yP);
    expect(yC2).toBeGreaterThan(yP);
    expect(yC1).toBe(yC2);
  });

  it('two siblings are placed at different X positions', () => {
    const nodes = runLayout(
      [{ id: 'P' }, { id: 'C1' }, { id: 'C2' }],
      [['P', 'C1'], ['P', 'C2']],
    );
    expect(pos(nodes, 'C1').x).not.toBe(pos(nodes, 'C2').x);
  });

  it('Y separation between ranks equals verticalNodeSpacing', () => {
    const nodes = runLayout(
      [{ id: 'root' }, { id: 'child' }],
      [['root', 'child']],
      { verticalNodeSpacing: 150 },
    );
    expect(pos(nodes, 'child').y - pos(nodes, 'root').y).toBe(150);
  });
});

// ─── Direction: DU (Down-Up / inverted) ──────────────────────────────────────

describe('hierarchical layout – DU direction (bottom-to-top)', () => {
  it('root node is placed below its child', () => {
    const nodes = runLayout(
      [{ id: 'root' }, { id: 'child' }],
      [['root', 'child']],
      { direction: 'DU' },
    );
    expect(pos(nodes, 'child').y).toBeLessThan(pos(nodes, 'root').y);
  });

  it('linear chain A→B→C has decreasing Y values', () => {
    const nodes = runLayout(
      [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
      [['A', 'B'], ['B', 'C']],
      { direction: 'DU' },
    );
    expect(pos(nodes, 'B').y).toBeLessThan(pos(nodes, 'A').y);
    expect(pos(nodes, 'C').y).toBeLessThan(pos(nodes, 'B').y);
  });
});

// ─── Direction: LR (Left-Right) ──────────────────────────────────────────────

describe('hierarchical layout – LR direction (left-to-right)', () => {
  it('root node is placed to the left of its child', () => {
    const nodes = runLayout(
      [{ id: 'root' }, { id: 'child' }],
      [['root', 'child']],
      { direction: 'LR' },
    );
    expect(pos(nodes, 'child').x).toBeGreaterThan(pos(nodes, 'root').x);
  });

  it('linear chain A→B→C has increasing X values', () => {
    const nodes = runLayout(
      [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
      [['A', 'B'], ['B', 'C']],
      { direction: 'LR' },
    );
    expect(pos(nodes, 'B').x).toBeGreaterThan(pos(nodes, 'A').x);
    expect(pos(nodes, 'C').x).toBeGreaterThan(pos(nodes, 'B').x);
  });

  it('two siblings share the same X, both to the right of parent', () => {
    const nodes = runLayout(
      [{ id: 'P' }, { id: 'C1' }, { id: 'C2' }],
      [['P', 'C1'], ['P', 'C2']],
      { direction: 'LR' },
    );
    expect(pos(nodes, 'C1').x).toBeGreaterThan(pos(nodes, 'P').x);
    expect(pos(nodes, 'C2').x).toBeGreaterThan(pos(nodes, 'P').x);
    expect(pos(nodes, 'C1').x).toBe(pos(nodes, 'C2').x);
  });
});

// ─── Direction: RL (Right-Left) ──────────────────────────────────────────────

describe('hierarchical layout – RL direction (right-to-left)', () => {
  it('root node is placed to the right of its child', () => {
    const nodes = runLayout(
      [{ id: 'root' }, { id: 'child' }],
      [['root', 'child']],
      { direction: 'RL' },
    );
    expect(pos(nodes, 'child').x).toBeLessThan(pos(nodes, 'root').x);
  });
});

// ─── Multiple roots ───────────────────────────────────────────────────────────

describe('hierarchical layout – multiple roots', () => {
  it('two independent trees both get positioned', () => {
    // Tree 1: A→B, Tree 2: X→Y
    const nodes = runLayout(
      [{ id: 'A' }, { id: 'B' }, { id: 'X' }, { id: 'Y' }],
      [['A', 'B'], ['X', 'Y']],
    );
    // Both trees' children should be below their roots in UD
    expect(pos(nodes, 'B').y).toBeGreaterThan(pos(nodes, 'A').y);
    expect(pos(nodes, 'Y').y).toBeGreaterThan(pos(nodes, 'X').y);
  });
});

// ─── Fixed nodes ──────────────────────────────────────────────────────────────

describe('hierarchical layout – fixed nodes', () => {
  it('does not move a fixed node', () => {
    const nodeMap = new Map<string, NetiPlotNode>();
    const fixed = new NetiPlotNode('fixed', { id: 'fixed', x: 999, y: 888, fixed: true }, {});
    const child = new NetiPlotNode('child', { id: 'child' }, {});
    nodeMap.set('fixed', fixed);
    nodeMap.set('child', child);

    const edgeMap = new Map<string, NetiPlotEdge>();
    edgeMap.set('e0', new NetiPlotEdge('e0', { id: 'e0', from: 'fixed', to: 'child' }, child, fixed, 0));

    hierarchical(
      { nodeMap, edgeMap },
      { isDirected: true, spaceNodesByScreenSize: false },
      TEST_SCREEN,
    );

    // Fixed node should not have a new destination
    expect(fixed.destination).toBeNull();
    // Its x/y should be untouched
    expect(fixed.x).toBe(999);
    expect(fixed.y).toBe(888);
  });
});

// ─── Callbacks and return value ───────────────────────────────────────────────

describe('hierarchical layout – lifecycle', () => {
  it('calls onStopped when provided', () => {
    const onStopped = jest.fn();
    const nodes = new Map<string, NetiPlotNode>([
      ['A', new NetiPlotNode('A', { id: 'A' }, {})],
    ]);
    hierarchical({ nodeMap: nodes, edgeMap: new Map() }, {}, TEST_SCREEN, onStopped);
    expect(onStopped).toHaveBeenCalledTimes(1);
  });

  it('returns true', () => {
    const nodes = new Map<string, NetiPlotNode>([
      ['A', new NetiPlotNode('A', { id: 'A' }, {})],
    ]);
    const result = hierarchical({ nodeMap: nodes, edgeMap: new Map() }, {}, TEST_SCREEN);
    expect(result).toBe(true);
  });

  it('cleans up internal layout properties from nodes after running', () => {
    const nodes = runLayout([{ id: 'A' }, { id: 'B' }], [['A', 'B']]);
    const n = nodes.get('A')!;
    expect((n as any).rank).toBeUndefined();
    expect((n as any).order).toBeUndefined();
    expect((n as any).parent).toBeUndefined();
    expect((n as any).children).toBeUndefined();
    expect((n as any).isParent).toBeUndefined();
    expect((n as any).isChild).toBeUndefined();
  });
});

// ─── Utils: pure functions ────────────────────────────────────────────────────

describe('compareByMass', () => {
  it('sorts heavier nodes first', () => {
    const a = { mass: 3 };
    const b = { mass: 1 };
    expect(compareByMass(a, b)).toBeLessThan(0); // b-a: 1-3 < 0 → a first
  });

  it('returns 0 for equal masses', () => {
    expect(compareByMass({ mass: 2 }, { mass: 2 })).toBe(0);
  });

  it('treats missing mass as 0', () => {
    expect(compareByMass({} as any, {} as any)).toBe(0);
  });
});

describe('compareByParentChild', () => {
  it('sorts pure parents (isParent=true, isChild=false) before non-parents', () => {
    const parent = { isParent: true, isChild: false, mass: 1 };
    const notParent = { isParent: false, isChild: false, mass: 1 };
    // sort(compareFn) puts 'a' before 'b' when result < 0
    // bVal - aVal: parent bVal=1, notParent aVal=0 → 1-0=1 (parent sorts first)
    expect(compareByParentChild(notParent, parent)).toBeGreaterThan(0);
    expect([notParent, parent].sort(compareByParentChild)[0]).toBe(parent);
  });

  it('does not prioritise a node that is both parent and child', () => {
    const parentAndChild = { isParent: true, isChild: true, mass: 1 };
    const pureParent = { isParent: true, isChild: false, mass: 1 };
    expect([parentAndChild, pureParent].sort(compareByParentChild)[0]).toBe(pureParent);
  });
});

describe('compareByOrder', () => {
  it('sorts by parent order ascending', () => {
    const a = { parent: { order: 1 }, width: 1, mass: 1 };
    const b = { parent: { order: 3 }, width: 1, mass: 1 };
    expect(compareByOrder(a, b)).toBeLessThan(0); // a has lower parent order → first
  });

  it('falls back to width descending when parent orders are equal', () => {
    const a = { parent: { order: 0 }, width: 1, mass: 1 };
    const b = { parent: { order: 0 }, width: 3, mass: 1 };
    expect(compareByOrder(a, b)).toBeGreaterThan(0); // b is wider → first
  });
});

describe('assignEdgeParentChild', () => {
  it('marks edge.end as isChild and edge.start as isParent', () => {
    const start = { isParent: false } as any;
    const end = { isChild: false } as any;
    assignEdgeParentChild({ start, end } as any);
    expect(start.isParent).toBe(true);
    expect(end.isChild).toBe(true);
  });
});

describe('getWidth', () => {
  it('returns 1 for a leaf node (no children)', () => {
    const leaf = { children: [] } as any;
    expect(getWidth(leaf)).toBe(1);
    expect(leaf.width).toBe(1);
  });

  it('returns sum of children widths for a parent', () => {
    const c1 = { children: [] } as any;
    const c2 = { children: [] } as any;
    const parent = { children: [c1, c2] } as any;
    expect(getWidth(parent)).toBe(2);
    expect(parent.width).toBe(2);
  });

  it('returns 1 for a null node', () => {
    expect(getWidth(null)).toBe(1);
  });

  it('handles deep trees', () => {
    const leaf1 = { children: [] } as any;
    const leaf2 = { children: [] } as any;
    const leaf3 = { children: [] } as any;
    const mid = { children: [leaf1, leaf2] } as any;
    const root = { children: [mid, leaf3] } as any;
    // mid width = 2, leaf3 width = 1, root = 3
    expect(getWidth(root)).toBe(3);
  });
});

describe('scaleCoords', () => {
  it('multiplies x and y by their respective spacings', () => {
    const fn = scaleCoords(100, 200);
    expect(fn({ id: 'a', x: 2, y: 3 } as any)).toMatchObject({ x: 200, y: 600 });
  });

  it('preserves the id field', () => {
    const fn = scaleCoords(10, 10);
    expect(fn({ id: 'test', x: 1, y: 1 } as any)).toMatchObject({ id: 'test' });
  });
});

describe('getBounds (layout utils)', () => {
  it('returns zeros for an empty array', () => {
    expect(getBounds([])).toMatchObject({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('returns correct bounds for a set of coords', () => {
    const bounds = getBounds([
      { x: -10, y: 5 },
      { x: 50, y: -20 },
      { x: 30, y: 80 },
    ]);
    expect(bounds.minX).toBe(-10);
    expect(bounds.minY).toBe(-20);
    expect(bounds.maxX).toBe(50);
    expect(bounds.maxY).toBe(80);
    expect(bounds.width).toBe(60);
    expect(bounds.height).toBe(100);
  });
});

describe('getNodeBounds', () => {
  it('returns correct bounds from node positions', () => {
    const nodes = [
      { x: 0, y: 0 }, { x: 100, y: 200 }, { x: -50, y: 150 },
    ] as any[];
    const b = getNodeBounds(nodes);
    expect(b.minX).toBe(-50);
    expect(b.maxX).toBe(100);
    expect(b.minY).toBe(0);
    expect(b.maxY).toBe(200);
  });
});

describe('shouldAssignCoords', () => {
  it('returns true when fixed is false', () => {
    expect(shouldAssignCoords({ x: 0, y: 0, fixed: false })).toBe(true);
  });

  it('returns true when x is undefined', () => {
    expect(shouldAssignCoords({ x: undefined, y: 0, fixed: true })).toBe(true);
  });

  it('returns true when y is null', () => {
    expect(shouldAssignCoords({ x: 0, y: null, fixed: true })).toBe(true);
  });

  it('returns false when x and y are set and fixed is true', () => {
    expect(shouldAssignCoords({ x: 10, y: 20, fixed: true })).toBe(false);
  });

  it('returns false when x and y are 0 and fixed is true', () => {
    // 0 is NOT falsy-non-numeric — only undefined/null/false are
    expect(shouldAssignCoords({ x: 0, y: 0, fixed: true })).toBe(false);
  });
});

describe('assignCoords', () => {
  it('sets destination when node already has x/y', () => {
    const node = { id: 'n', x: 0, y: 0, destination: null } as any;
    const coordsMap = new Map([['n', { id: 'n', x: 50, y: 100 }]]);
    const fn = assignCoords((n: any) => coordsMap.get(n.id));
    fn(node);
    expect(node.destination).toEqual({ x: 50, y: 100 });
    expect(node.x).toBe(0); // x unchanged
  });

  it('sets x/y directly when node has no coordinates yet', () => {
    const node = { id: 'n' } as any; // no x or y defined
    const coordsMap = new Map([['n', { id: 'n', x: 42, y: 77 }]]);
    const fn = assignCoords((n: any) => coordsMap.get(n.id));
    fn(node);
    expect(node.x).toBe(42);
    expect(node.y).toBe(77);
    expect(node.destination).toBeUndefined();
  });
});

describe('getCoordsKeyValuePairs', () => {
  it('converts coords array to [id, coords] pairs', () => {
    const coords = [{ id: 'a', x: 1, y: 2 }, { id: 'b', x: 3, y: 4 }];
    const pairs = getCoordsKeyValuePairs(coords);
    expect(pairs).toEqual([['a', coords[0]], ['b', coords[1]]]);
  });
});

describe('scaleCoordsByScreenSize', () => {
  it('returns a function that scales coords', () => {
    const coords = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 1, y: 1 }];
    const fn = scaleCoordsByScreenSize(coords, { width: 800, height: 600 });
    const result = fn({ id: 'b', x: 1, y: 1 } as any);
    expect(result.x).toBeGreaterThan(0);
    expect(result.y).toBeGreaterThan(0);
  });

  it('uses adjustedXSpacing of 100', () => {
    // adjustedXSpacing is hardcoded to 100 inside scaleCoordsByScreenSize
    const coords = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 1, y: 0 }];
    const fn = scaleCoordsByScreenSize(coords, { width: 800, height: 600 });
    const result = fn({ id: 'b', x: 1, y: 0 } as any);
    expect(result.x).toBe(100);
  });
});
