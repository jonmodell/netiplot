import { InteractionState, NetiPlotNodeDefinition, NetiPlotShapeDefinition } from '../types';

export const initialInteraction: InteractionState = {
  action: null,
  draggedNodes: [],
  dragMouseMoved: false,
  shape: null,
  shapeHandle: null,
};

export type InteractionAction =
  | { type: 'addToDrag'; payload: NetiPlotNodeDefinition[] }
  | { type: 'edgeDown' }
  | { type: 'endLayout' }
  | { type: 'handleDown'; payload: string }
  | { type: 'handleMove' }
  | { type: 'handleUp' }
  | { type: 'mouseMoved' }
  | { type: 'pan' }
  | { type: 'releaseDrag' }
  | { type: 'reset' }
  | { type: 'runLayout' }
  | { type: 'shapeDown'; payload: NetiPlotShapeDefinition }
  | { type: 'shapeMove' }
  | { type: 'shapeUp' };

export function interactionReducer(state: InteractionState, action: InteractionAction): InteractionState {
  switch (action.type) {
    case 'addToDrag': {
      return {
        ...state,
        action: 'drag',
        draggedNodes: action.payload,
      };
    }
    case 'edgeDown': {
      return {
        ...state,
        action: 'edgeDown',
        mouseMoved: false,
        draggedNodes: [],
      };
    }
    case 'pan': {
      return {
        ...state,
        action: 'pan',
        shape: null,
        shapeHandle: null,
        draggedNodes: [],
        mouseMoved: false,
      };
    }
    case 'releaseDrag': {
      return {
        ...state,
        action: null,
        dragMouseMoved: false,
      };
    }
    case 'mouseMoved': {
      return {
        ...state,
        mouseMoved: true,
      };
    }
    case 'runLayout': {
      return {
        ...state,
        action: 'layout',
      };
    }
    case 'endLayout': {
      return {
        ...state,
        action: null,
      };
    }
    case 'shapeDown': {
      return {
        ...state,
        action: 'shapeDrag',
        shapeHandle: null,
        mouseMoved: false,
        shape: action.payload,
      };
    }
    case 'shapeUp': {
      return {
        ...state,
        action: null,
        shapeHandle: null,
      };
    }
    case 'shapeMove': {
      return {
        ...state,
        mouseMoved: true,
      };
    }
    case 'handleDown': {
      return {
        ...state,
        action: 'handleDrag',
        mouseMoved: false,
        shapeHandle: action.payload,
      };
    }
    case 'handleMove': {
      return {
        ...state,
        mouseMoved: true,
      };
    }
    case 'handleUp': {
      return {
        ...state,
        action: null,
        shapeHandle: null,
      };
    }
    case 'reset': {
      return { ...initialInteraction, action: state.action };
    }
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unhandled type: ${(_exhaustive as InteractionAction).type}`);
    }
  }
}
