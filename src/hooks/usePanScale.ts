import { useReducer } from 'react';
import { panScaleReducer, initialPanScaleState } from '../core/panScaleState';

export { initialPanScaleState } from '../core/panScaleState';
export type { PanScaleAction } from '../core/panScaleState';

function usePanScale({ reducer = panScaleReducer } = {}) {
  const [psState, dispatch] = useReducer(reducer, initialPanScaleState);
  return { psState, panScaleDispatch: dispatch };
}

export { usePanScale };
