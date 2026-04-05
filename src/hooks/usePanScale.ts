import { useReducer } from 'react';
import { PanScaleState, Bounds, RevisScreen } from '../types';

export const initialPanScaleState: PanScaleState = {
  destinationScale: null,
  destinationPan: null,
  scale: 0.1,
  pan: { x: 300, y: 300 },
  panPerFrame: null,
};

export type PanScaleAction =
  | { type: 'destination'; payload: { pan: { x: number; y: number }; scale: number } }
  | { type: 'edgePan' }
  | { type: 'framePan'; payload: { x: number; y: number } | null }
  | { type: 'keyAction'; payload: string }
  | { type: 'pan'; payload: { x: number; y: number } }
  | { type: 'set'; payload: PanScaleState }
  | { type: 'zoomIn'; payload: { screen: RevisScreen; bounds: Bounds } }
  | { type: 'zoomOut'; payload: { screen: RevisScreen; newScale: number; bounds: Bounds } }
  | { type: 'zoomPanimate' }
  | { type: 'zoomSelection'; payload: { screen: RevisScreen; dn: { x: number; y: number } } }
  | { type: 'zoomToPoint'; payload: { pos: { x: number; y: number }; screen: RevisScreen } };

const KEY_PAN_FACTOR = 10;
const SCALE_FACTOR = 0.5;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 6;

function panScaleReducer(state: PanScaleState, action: PanScaleAction): PanScaleState {
  switch (action.type) {
    case 'keyAction': {
      const a = action.payload;
      let { pan, scale } = { ...state };
      switch (a) {
        case '_moveUp':
          pan.y -= KEY_PAN_FACTOR;
          break;
        case '_moveDown':
          pan.y += KEY_PAN_FACTOR;
          break;
        case '_moveLeft':
          pan.x -= KEY_PAN_FACTOR;
          break;
        case '_moveRight':
          pan.x += KEY_PAN_FACTOR;
          break;
        case '_zoomIn':
          scale = Math.min(MAX_ZOOM, scale + SCALE_FACTOR / 5);
          break;
        case '_zoomOut':
          scale = Math.max(MIN_ZOOM, scale - SCALE_FACTOR / 5);
          break;
        case '_1':
          scale = 1;
          break;
        case '_2':
          scale = 2;
          break;
        case '_3':
          scale = 3;
          break;
        case '_0.5':
          scale = 0.5;
          break;
        default:
          break;
      }

      return { ...state, pan, scale };
    }
    case 'set': {
      return action.payload;
    }
    case 'destination': {
      return {
        ...state,
        destinationScale: action.payload.scale,
        destinationPan: action.payload.pan,
      };
    }
    case 'pan': {
      return {
        ...state,
        pan: action.payload,
      };
    }
    case 'framePan': {
      return {
        ...state,
        panPerFrame: action.payload,
      };
    }
    case 'zoomPanimate': {
      const { pan, scale, destinationScale, destinationPan } = state;
      if (!destinationScale || !destinationPan || !pan) return { ...state };
      const scaleDiff = destinationScale - scale;

      const xDiff = destinationPan.x - pan.x;
      const yDiff = destinationPan.y - pan.y;
      if (
        scaleDiff * scaleDiff > 0.0005 ||
        xDiff * xDiff > 4 ||
        yDiff * yDiff > 4
      ) {
        const calculatedScale = scale + scaleDiff / 4;
        return {
          ...state,
          scale: calculatedScale,
          pan: {
            x: Number(pan.x) + xDiff / 4,
            y: Number(pan.y) + yDiff / 4,
          },
        };
      }

      return {
        ...state,
        scale: destinationScale,
        pan: { x: Number(destinationPan.x), y: Number(destinationPan.y) },
        destinationScale: null,
        destinationPan: null,
      };
    }
    case 'edgePan': {
      const { scale, panPerFrame, pan } = state;
      if (!panPerFrame) return state;
      const pn = { ...pan };
      pn.x += panPerFrame.x * scale;
      pn.y += panPerFrame.y * scale;

      return {
        ...state,
        pan: pn,
      };
    }
    case 'zoomOut': {
      const { newScale, bounds, screen } = action.payload;
      const nsf = Math.max(
        state.scale - SCALE_FACTOR,
        Math.min(MIN_ZOOM, newScale),
      );
      const x = (screen.width as number) / 2 - ((bounds.width || 0) / 2 + bounds.minX) * nsf;
      const y = (screen.height as number) / 2 - ((bounds.height || 0) / 2 + bounds.minY) * nsf;
      return {
        ...state,
        destinationScale: nsf,
        destinationPan: { x, y },
      };
    }
    case 'zoomIn': {
      const { bounds, screen } = action.payload;
      const nsf = Math.min(state.scale + SCALE_FACTOR, MAX_ZOOM);
      const x = (screen.width as number) / 2 - ((bounds.width || 0) / 2 + bounds.minX) * nsf;
      const y = (screen.height as number) / 2 - ((bounds.height || 0) / 2 + bounds.minY) * nsf;
      return {
        ...state,
        destinationScale: nsf,
        destinationPan: { x, y },
      };
    }
    case 'zoomSelection': {
      const { dn, screen } = action.payload;
      return {
        ...state,
        destinationScale: 2,
        destinationPan: {
          x: (screen.width as number) / 2 - dn.x * 2,
          y: (screen.height as number) / 2 - dn.y * 2,
        },
      };
    }

    case 'zoomToPoint': {
      const { pos, screen } = action.payload;
      const nsf = Math.min(state.scale + SCALE_FACTOR, MAX_ZOOM);
      return {
        ...state,
        destinationScale: nsf,
        destinationPan: {
          x: ((screen.width as number) / 2 - pos.x) * nsf,
          y: ((screen.height as number) / 2 - pos.y) * nsf,
        },
      };
    }

    default: {
      const _exhaustive: never = action;
      throw new Error(`Unhandled type: ${(_exhaustive as PanScaleAction).type}`);
    }
  }
}

function usePanScale({ reducer = panScaleReducer } = {}) {
  const [psState, dispatch] = useReducer(reducer, initialPanScaleState);
  return { psState, panScaleDispatch: dispatch };
}

export { usePanScale };
