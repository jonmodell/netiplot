import { RevisNode } from './RevisNode';
import type { RevisOptions } from '../types';

const opts: RevisOptions = {};
const optsWithSize: RevisOptions = { nodes: { defaultSize: 50 } };

describe('RevisNode constructor', () => {
  it('sets id, x, y from definition', () => {
    const n = new RevisNode('n1', { id: 'n1', x: 10, y: 20 }, opts);
    expect(n.id).toBe('n1');
    expect(n.x).toBe(10);
    expect(n.y).toBe(20);
  });

  it('converts numeric id to string', () => {
    const n = new RevisNode(42 as unknown as string, { id: '42' }, opts);
    expect(n.id).toBe('42');
  });

  it('defaults x and y to 0 when not provided', () => {
    const n = new RevisNode('n1', { id: 'n1' }, opts);
    expect(n.x).toBe(0);
    expect(n.y).toBe(0);
  });

  it('uses definition.size when provided', () => {
    const n = new RevisNode('n1', { id: 'n1', size: 60 }, opts);
    expect(n.size).toBe(60);
  });

  it('falls back to options.nodes.defaultSize', () => {
    const n = new RevisNode('n1', { id: 'n1' }, optsWithSize);
    expect(n.size).toBe(50);
  });

  it('falls back to NODE_SIZE (30) default', () => {
    const n = new RevisNode('n1', { id: 'n1' }, opts);
    expect(n.size).toBe(30);
  });

  it('sets fixed from definition', () => {
    const n = new RevisNode('n1', { id: 'n1', fixed: true }, opts);
    expect(n.fixed).toBe(true);
  });

  it('destination starts as null', () => {
    const n = new RevisNode('n1', { id: 'n1' }, opts);
    expect(n.destination).toBeNull();
  });

  it('stores definition reference', () => {
    const def = { id: 'n1', x: 5, y: 10 };
    const n = new RevisNode('n1', def, opts);
    expect(n.definition).toBe(def);
  });
});

describe('RevisNode update', () => {
  it('updates the definition reference', () => {
    const n = new RevisNode('n1', { id: 'n1', x: 0, y: 0 }, opts);
    const newDef = { id: 'n1', x: 99, y: 88 };
    n.update(newDef);
    expect(n.definition).toBe(newDef);
  });

  it('clears fixed when update sets fixed to false', () => {
    const n = new RevisNode('n1', { id: 'n1', fixed: true }, opts);
    n.update({ id: 'n1', fixed: false });
    expect(n.fixed).toBe(false);
  });

  it('does not change fixed when update omits fixed', () => {
    const n = new RevisNode('n1', { id: 'n1', fixed: true }, opts);
    n.fixed = true;
    n.update({ id: 'n1' });
    // fixed is not explicitly set to false, so it should remain
    expect(n.fixed).toBe(true);
  });
});

describe('RevisNode destroy', () => {
  it('sets delete flag', () => {
    const n = new RevisNode('n1', { id: 'n1' }, opts);
    expect(n.delete).toBe(false);
    n.destroy();
    expect(n.delete).toBe(true);
  });
});

describe('RevisNode render', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Minimal canvas 2D context mock
    ctx = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      drawImage: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: 'center',
    } as unknown as CanvasRenderingContext2D;
  });

  it('moves toward destination each render', () => {
    const n = new RevisNode('n1', { id: 'n1', x: 0, y: 0 }, opts);
    n.destination = { x: 100, y: 100 };
    const state = { scale: 1, options: { nodes: {} }, rolloverItem: null };
    n.render(state, ctx, {}, null as unknown as Function);
    expect(n.x).toBeGreaterThan(0);
    expect(n.y).toBeGreaterThan(0);
    expect(n.x).toBeLessThan(100);
  });

  it('clears destination once arrived', () => {
    const n = new RevisNode('n1', { id: 'n1', x: 99.9, y: 99.9 }, opts);
    n.destination = { x: 100, y: 100 };
    const state = { scale: 1, options: { nodes: {} }, rolloverItem: null };
    n.render(state, ctx, {}, null as unknown as Function);
    expect(n.destination).toBeNull();
  });

  it('calls drawingFunction when provided', () => {
    const n = new RevisNode('n1', { id: 'n1', x: 0, y: 0 }, opts);
    const drawFn = jest.fn();
    const state = { scale: 1, options: { nodes: {} }, rolloverItem: null };
    n.render(state, ctx, {}, drawFn);
    expect(drawFn).toHaveBeenCalled();
  });

  it('falls back to arc when no drawingFunction', () => {
    const n = new RevisNode('n1', { id: 'n1', x: 0, y: 0 }, opts);
    const state = { scale: 1, options: { nodes: {} }, rolloverItem: null };
    n.render(state, ctx, {}, null as unknown as Function);
    expect((ctx.arc as jest.Mock).mock.calls.length).toBeGreaterThan(0);
  });
});
