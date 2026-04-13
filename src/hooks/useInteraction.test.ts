import { renderHook, act } from '@testing-library/react';
import { useInteraction, initialInteraction } from './useInteraction';
import type { NetiPlotShapeDefinition } from '../types';

const shape: NetiPlotShapeDefinition = { shape: 'rect', x: 0, y: 0, width: 50, height: 50 };
const nodeDef = { id: 'n1', x: 10, y: 20 };

describe('useInteraction initial state', () => {
  it('starts with null action and empty drag list', () => {
    const { result } = renderHook(() => useInteraction());
    expect(result.current.interactionState.action).toBeNull();
    expect(result.current.interactionState.draggedNodes).toEqual([]);
    expect(result.current.interactionState.shape).toBeNull();
    expect(result.current.interactionState.shapeHandle).toBeNull();
  });
});

describe('interactionReducer', () => {
  it('addToDrag sets action to drag with payload nodes', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'addToDrag', payload: [nodeDef] }));
    expect(result.current.interactionState.action).toBe('drag');
    expect(result.current.interactionState.draggedNodes).toEqual([nodeDef]);
  });

  it('edgeDown sets action to edgeDown', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'edgeDown' }));
    expect(result.current.interactionState.action).toBe('edgeDown');
    expect(result.current.interactionState.draggedNodes).toEqual([]);
  });

  it('pan sets action to pan and clears nodes', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'addToDrag', payload: [nodeDef] }));
    act(() => result.current.interactionDispatch({ type: 'pan' }));
    expect(result.current.interactionState.action).toBe('pan');
    expect(result.current.interactionState.draggedNodes).toEqual([]);
  });

  it('releaseDrag clears action', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'addToDrag', payload: [nodeDef] }));
    act(() => result.current.interactionDispatch({ type: 'releaseDrag' }));
    expect(result.current.interactionState.action).toBeNull();
  });

  it('mouseMoved sets mouseMoved to true', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'mouseMoved' }));
    expect(result.current.interactionState.mouseMoved).toBe(true);
  });

  it('runLayout sets action to layout', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'runLayout' }));
    expect(result.current.interactionState.action).toBe('layout');
  });

  it('endLayout clears action', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'runLayout' }));
    act(() => result.current.interactionDispatch({ type: 'endLayout' }));
    expect(result.current.interactionState.action).toBeNull();
  });

  it('shapeDown sets action to shapeDrag and stores shape', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'shapeDown', payload: shape }));
    expect(result.current.interactionState.action).toBe('shapeDrag');
    expect(result.current.interactionState.shape).toBe(shape);
    expect(result.current.interactionState.shapeHandle).toBeNull();
  });

  it('shapeUp clears action and shapeHandle', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'shapeDown', payload: shape }));
    act(() => result.current.interactionDispatch({ type: 'shapeUp' }));
    expect(result.current.interactionState.action).toBeNull();
    expect(result.current.interactionState.shapeHandle).toBeNull();
  });

  it('shapeMove sets mouseMoved to true', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'shapeDown', payload: shape }));
    act(() => result.current.interactionDispatch({ type: 'shapeMove' }));
    expect(result.current.interactionState.mouseMoved).toBe(true);
  });

  it('handleDown sets action to handleDrag with handle id', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'handleDown', payload: 'tl' }));
    expect(result.current.interactionState.action).toBe('handleDrag');
    expect(result.current.interactionState.shapeHandle).toBe('tl');
  });

  it('handleMove sets mouseMoved to true', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'handleMove' }));
    expect(result.current.interactionState.mouseMoved).toBe(true);
  });

  it('handleUp clears action and shapeHandle', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'handleDown', payload: 'br' }));
    act(() => result.current.interactionDispatch({ type: 'handleUp' }));
    expect(result.current.interactionState.action).toBeNull();
    expect(result.current.interactionState.shapeHandle).toBeNull();
  });

  it('reset preserves current action but resets other fields', () => {
    const { result } = renderHook(() => useInteraction());
    act(() => result.current.interactionDispatch({ type: 'runLayout' }));
    act(() => result.current.interactionDispatch({ type: 'reset' }));
    expect(result.current.interactionState.action).toBe('layout');
    expect(result.current.interactionState.draggedNodes).toEqual([]);
    expect(result.current.interactionState.shape).toBeNull();
  });
});
