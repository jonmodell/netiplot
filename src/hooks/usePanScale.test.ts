import { initialPanScaleState } from './usePanScale';
import type { PanScaleAction } from './usePanScale';
import type { PanScaleState, Bounds, NetiPlotScreen } from '../types';

// Test the reducer directly by importing it — it's not exported, so we test
// it through the initial state + dispatch shapes that mirror the reducer logic.
// We re-implement a minimal inline reducer call to keep tests pure.

// Pull out the reducer by re-requiring the module with a test shim — instead,
// extract the reducer function by importing it indirectly via a small re-export.
// Since the reducer is not exported, we test it via renderHook.

import { renderHook, act } from '@testing-library/react';
import { usePanScale } from './usePanScale';

const defaultScreen: NetiPlotScreen = {
  width: 800, height: 600, ratio: 1,
  boundingRect: { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) } as DOMRect,
};
const defaultBounds: Bounds = { minX: 0, minY: 0, maxX: 200, maxY: 150, width: 200, height: 150 };

function dispatch(action: PanScaleAction) {
  const { result } = renderHook(() => usePanScale());
  act(() => result.current.panScaleDispatch(action));
  return result.current.psState;
}

describe('usePanScale initial state', () => {
  it('starts with correct defaults', () => {
    const { result } = renderHook(() => usePanScale());
    expect(result.current.psState.scale).toBe(0.1);
    expect(result.current.psState.destinationPan).toBeNull();
    expect(result.current.psState.destinationScale).toBeNull();
    expect(result.current.psState.panPerFrame).toBeNull();
  });
});

describe('panScaleReducer', () => {
  it('pan action updates pan coordinates', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({ type: 'pan', payload: { x: 50, y: 75 } }));
    expect(result.current.psState.pan).toEqual({ x: 50, y: 75 });
  });

  it('set action replaces entire state', () => {
    const newState: PanScaleState = { ...initialPanScaleState, scale: 3, pan: { x: 100, y: 200 } };
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({ type: 'set', payload: newState }));
    expect(result.current.psState.scale).toBe(3);
    expect(result.current.psState.pan).toEqual({ x: 100, y: 200 });
  });

  it('destination action sets destinationScale and destinationPan', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({
      type: 'destination',
      payload: { scale: 2, pan: { x: 10, y: 20 } },
    }));
    expect(result.current.psState.destinationScale).toBe(2);
    expect(result.current.psState.destinationPan).toEqual({ x: 10, y: 20 });
  });

  it('framePan action sets panPerFrame', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({ type: 'framePan', payload: { x: 5, y: -3 } }));
    expect(result.current.psState.panPerFrame).toEqual({ x: 5, y: -3 });
  });

  it('framePan null clears panPerFrame', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({ type: 'framePan', payload: { x: 5, y: 3 } }));
    act(() => result.current.panScaleDispatch({ type: 'framePan', payload: null }));
    expect(result.current.psState.panPerFrame).toBeNull();
  });

  it('zoomIn action increases destinationScale', () => {
    const { result } = renderHook(() => usePanScale());
    // set scale to 1 first
    act(() => result.current.panScaleDispatch({ type: 'set', payload: { ...initialPanScaleState, scale: 1 } }));
    act(() => result.current.panScaleDispatch({
      type: 'zoomIn',
      payload: { screen: defaultScreen, bounds: defaultBounds },
    }));
    expect(result.current.psState.destinationScale).toBeGreaterThan(1);
  });

  it('zoomOut action decreases destinationScale', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({ type: 'set', payload: { ...initialPanScaleState, scale: 3 } }));
    act(() => result.current.panScaleDispatch({
      type: 'zoomOut',
      payload: { screen: defaultScreen, newScale: 0.6, bounds: defaultBounds },
    }));
    expect(result.current.psState.destinationScale).toBeLessThan(3);
  });

  it('zoomSelection sets destination to center on selected node', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({
      type: 'zoomSelection',
      payload: { screen: defaultScreen, dn: { x: 100, y: 80 } },
    }));
    expect(result.current.psState.destinationScale).toBe(2);
    expect(result.current.psState.destinationPan!.x).toBe(800 / 2 - 100 * 2); // 200
    expect(result.current.psState.destinationPan!.y).toBe(600 / 2 - 80 * 2);  // 140
  });

  it('keyAction _moveUp decreases pan.y', () => {
    const { result } = renderHook(() => usePanScale());
    const initialY = result.current.psState.pan.y;
    act(() => result.current.panScaleDispatch({ type: 'keyAction', payload: '_moveUp' }));
    expect(result.current.psState.pan.y).toBeLessThan(initialY);
  });

  it('keyAction _1 sets scale to 1', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({ type: 'keyAction', payload: '_1' }));
    expect(result.current.psState.scale).toBe(1);
  });

  it('keyAction _2 sets scale to 2', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({ type: 'keyAction', payload: '_2' }));
    expect(result.current.psState.scale).toBe(2);
  });

  it('zoomPanimate animates toward destination', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({
      type: 'set',
      payload: { ...initialPanScaleState, scale: 1, destinationScale: 2, destinationPan: { x: 100, y: 100 }, pan: { x: 0, y: 0 } },
    }));
    act(() => result.current.panScaleDispatch({ type: 'zoomPanimate' }));
    const s = result.current.psState;
    // should have moved toward destination
    expect(s.scale).toBeGreaterThan(1);
    expect(s.scale).toBeLessThan(2);
  });

  it('zoomPanimate snaps to destination when close', () => {
    const { result } = renderHook(() => usePanScale());
    act(() => result.current.panScaleDispatch({
      type: 'set',
      payload: {
        ...initialPanScaleState,
        scale: 1.999,
        destinationScale: 2,
        destinationPan: { x: 99.9, y: 99.9 },
        pan: { x: 99.8, y: 99.8 },
      },
    }));
    act(() => result.current.panScaleDispatch({ type: 'zoomPanimate' }));
    const s = result.current.psState;
    expect(s.scale).toBe(2);
    expect(s.destinationScale).toBeNull();
    expect(s.destinationPan).toBeNull();
  });
});
