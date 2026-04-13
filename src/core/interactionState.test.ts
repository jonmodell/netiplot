import { interactionReducer, initialInteraction } from './interactionState';
import type { InteractionAction } from './interactionState';
import type { InteractionState, NetiPlotShapeDefinition } from '../types';

const shape: NetiPlotShapeDefinition = { shape: 'rect', x: 0, y: 0, width: 50, height: 50 };
const nodeDef = { id: 'n1', x: 10, y: 20 };

function reduce(state: InteractionState, action: InteractionAction): InteractionState {
  return interactionReducer(state, action);
}

describe('initialInteraction', () => {
  it('starts with null action and empty drag list', () => {
    expect(initialInteraction.action).toBeNull();
    expect(initialInteraction.draggedNodes).toEqual([]);
    expect(initialInteraction.shape).toBeNull();
    expect(initialInteraction.shapeHandle).toBeNull();
  });
});

describe('interactionReducer', () => {
  it('addToDrag sets action to drag with payload nodes', () => {
    const s = reduce(initialInteraction, { type: 'addToDrag', payload: [nodeDef] });
    expect(s.action).toBe('drag');
    expect(s.draggedNodes).toEqual([nodeDef]);
  });

  it('edgeDown sets action to edgeDown', () => {
    const s = reduce(initialInteraction, { type: 'edgeDown' });
    expect(s.action).toBe('edgeDown');
    expect(s.draggedNodes).toEqual([]);
  });

  it('pan sets action to pan and clears nodes', () => {
    const s1 = reduce(initialInteraction, { type: 'addToDrag', payload: [nodeDef] });
    const s2 = reduce(s1, { type: 'pan' });
    expect(s2.action).toBe('pan');
    expect(s2.draggedNodes).toEqual([]);
  });

  it('releaseDrag clears action', () => {
    const s1 = reduce(initialInteraction, { type: 'addToDrag', payload: [nodeDef] });
    const s2 = reduce(s1, { type: 'releaseDrag' });
    expect(s2.action).toBeNull();
  });

  it('mouseMoved sets mouseMoved to true', () => {
    const s = reduce(initialInteraction, { type: 'mouseMoved' });
    expect(s.mouseMoved).toBe(true);
  });

  it('runLayout sets action to layout', () => {
    const s = reduce(initialInteraction, { type: 'runLayout' });
    expect(s.action).toBe('layout');
  });

  it('endLayout clears action', () => {
    const s1 = reduce(initialInteraction, { type: 'runLayout' });
    const s2 = reduce(s1, { type: 'endLayout' });
    expect(s2.action).toBeNull();
  });

  it('shapeDown sets action to shapeDrag and stores shape', () => {
    const s = reduce(initialInteraction, { type: 'shapeDown', payload: shape });
    expect(s.action).toBe('shapeDrag');
    expect(s.shape).toBe(shape);
    expect(s.shapeHandle).toBeNull();
  });

  it('shapeUp clears action and shapeHandle', () => {
    const s1 = reduce(initialInteraction, { type: 'shapeDown', payload: shape });
    const s2 = reduce(s1, { type: 'shapeUp' });
    expect(s2.action).toBeNull();
    expect(s2.shapeHandle).toBeNull();
  });

  it('shapeMove sets mouseMoved to true', () => {
    const s1 = reduce(initialInteraction, { type: 'shapeDown', payload: shape });
    const s2 = reduce(s1, { type: 'shapeMove' });
    expect(s2.mouseMoved).toBe(true);
  });

  it('handleDown sets action to handleDrag with handle id', () => {
    const s = reduce(initialInteraction, { type: 'handleDown', payload: 'tl' });
    expect(s.action).toBe('handleDrag');
    expect(s.shapeHandle).toBe('tl');
  });

  it('handleMove sets mouseMoved to true', () => {
    const s = reduce(initialInteraction, { type: 'handleMove' });
    expect(s.mouseMoved).toBe(true);
  });

  it('handleUp clears action and shapeHandle', () => {
    const s1 = reduce(initialInteraction, { type: 'handleDown', payload: 'br' });
    const s2 = reduce(s1, { type: 'handleUp' });
    expect(s2.action).toBeNull();
    expect(s2.shapeHandle).toBeNull();
  });

  it('reset preserves current action but resets other fields', () => {
    const s1 = reduce(initialInteraction, { type: 'runLayout' });
    const s2 = reduce(s1, { type: 'reset' });
    expect(s2.action).toBe('layout');
    expect(s2.draggedNodes).toEqual([]);
    expect(s2.shape).toBeNull();
  });

  it('throws on unknown action type', () => {
    expect(() => reduce(initialInteraction, { type: 'unknown' } as unknown as InteractionAction)).toThrow();
  });
});
