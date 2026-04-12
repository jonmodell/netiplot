import { panScaleReducer, initialPanScaleState } from './panScaleState';
import type { PanScaleAction } from './panScaleState';
import type { PanScaleState, Bounds, RevisScreen } from '../types';

const defaultScreen: RevisScreen = {
  width: 800,
  height: 600,
  ratio: 1,
  boundingRect: { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) } as DOMRect,
};
const defaultBounds: Bounds = { minX: 0, minY: 0, maxX: 200, maxY: 150, width: 200, height: 150 };

function reduce(state: PanScaleState, action: PanScaleAction): PanScaleState {
  return panScaleReducer(state, action);
}

describe('initialPanScaleState', () => {
  it('has correct defaults', () => {
    expect(initialPanScaleState.scale).toBe(0.1);
    expect(initialPanScaleState.destinationPan).toBeNull();
    expect(initialPanScaleState.destinationScale).toBeNull();
    expect(initialPanScaleState.panPerFrame).toBeNull();
  });
});

describe('panScaleReducer', () => {
  it('pan updates pan coordinates', () => {
    const s = reduce(initialPanScaleState, { type: 'pan', payload: { x: 50, y: 75 } });
    expect(s.pan).toEqual({ x: 50, y: 75 });
  });

  it('set replaces entire state', () => {
    const next: PanScaleState = { ...initialPanScaleState, scale: 3, pan: { x: 100, y: 200 } };
    const s = reduce(initialPanScaleState, { type: 'set', payload: next });
    expect(s.scale).toBe(3);
    expect(s.pan).toEqual({ x: 100, y: 200 });
  });

  it('destination sets destinationScale and destinationPan', () => {
    const s = reduce(initialPanScaleState, { type: 'destination', payload: { scale: 2, pan: { x: 10, y: 20 } } });
    expect(s.destinationScale).toBe(2);
    expect(s.destinationPan).toEqual({ x: 10, y: 20 });
  });

  it('framePan sets panPerFrame', () => {
    const s = reduce(initialPanScaleState, { type: 'framePan', payload: { x: 5, y: -3 } });
    expect(s.panPerFrame).toEqual({ x: 5, y: -3 });
  });

  it('framePan null clears panPerFrame', () => {
    const s1 = reduce(initialPanScaleState, { type: 'framePan', payload: { x: 5, y: 3 } });
    const s2 = reduce(s1, { type: 'framePan', payload: null });
    expect(s2.panPerFrame).toBeNull();
  });

  it('zoomIn increases destinationScale', () => {
    const base: PanScaleState = { ...initialPanScaleState, scale: 1 };
    const s = reduce(base, { type: 'zoomIn', payload: { screen: defaultScreen, bounds: defaultBounds } });
    expect(s.destinationScale).toBeGreaterThan(1);
  });

  it('zoomOut decreases destinationScale', () => {
    const base: PanScaleState = { ...initialPanScaleState, scale: 3 };
    const s = reduce(base, { type: 'zoomOut', payload: { screen: defaultScreen, newScale: 0.6, bounds: defaultBounds } });
    expect(s.destinationScale).toBeLessThan(3);
  });

  it('zoomSelection centers on selected node at scale 2', () => {
    const s = reduce(initialPanScaleState, {
      type: 'zoomSelection',
      payload: { screen: defaultScreen, dn: { x: 100, y: 80 } },
    });
    expect(s.destinationScale).toBe(2);
    expect(s.destinationPan!.x).toBe(800 / 2 - 100 * 2);
    expect(s.destinationPan!.y).toBe(600 / 2 - 80 * 2);
  });

  it('keyAction _moveUp decreases pan.y', () => {
    const s = reduce(initialPanScaleState, { type: 'keyAction', payload: '_moveUp' });
    expect(s.pan.y).toBeLessThan(initialPanScaleState.pan.y);
  });

  it('keyAction _1 sets scale to 1', () => {
    const s = reduce(initialPanScaleState, { type: 'keyAction', payload: '_1' });
    expect(s.scale).toBe(1);
  });

  it('keyAction _2 sets scale to 2', () => {
    const s = reduce(initialPanScaleState, { type: 'keyAction', payload: '_2' });
    expect(s.scale).toBe(2);
  });

  it('zoomPanimate animates toward destination', () => {
    const base: PanScaleState = {
      ...initialPanScaleState,
      scale: 1,
      destinationScale: 2,
      destinationPan: { x: 100, y: 100 },
      pan: { x: 0, y: 0 },
    };
    const s = reduce(base, { type: 'zoomPanimate' });
    expect(s.scale).toBeGreaterThan(1);
    expect(s.scale).toBeLessThan(2);
  });

  it('zoomPanimate snaps to destination when close', () => {
    const base: PanScaleState = {
      ...initialPanScaleState,
      scale: 1.999,
      destinationScale: 2,
      destinationPan: { x: 99.9, y: 99.9 },
      pan: { x: 99.8, y: 99.8 },
    };
    const s = reduce(base, { type: 'zoomPanimate' });
    expect(s.scale).toBe(2);
    expect(s.destinationScale).toBeNull();
    expect(s.destinationPan).toBeNull();
  });

  it('edgePan moves pan by panPerFrame * scale', () => {
    const base: PanScaleState = {
      ...initialPanScaleState,
      scale: 2,
      pan: { x: 10, y: 10 },
      panPerFrame: { x: 5, y: -3 },
    };
    const s = reduce(base, { type: 'edgePan' });
    expect(s.pan.x).toBe(10 + 5 * 2);
    expect(s.pan.y).toBe(10 + -3 * 2);
  });

  it('edgePan is no-op when panPerFrame is null', () => {
    const s = reduce(initialPanScaleState, { type: 'edgePan' });
    expect(s.pan).toEqual(initialPanScaleState.pan);
  });

  it('throws on unknown action type', () => {
    expect(() => reduce(initialPanScaleState, { type: 'unknown' } as unknown as PanScaleAction)).toThrow();
  });
});
