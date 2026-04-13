import { useReducer } from 'react';
import { interactionReducer, initialInteraction } from '../core/interactionState';

export { initialInteraction } from '../core/interactionState';
export type { InteractionAction } from '../core/interactionState';

function useInteraction({ reducer = interactionReducer } = {}) {
  const [interactionState, dispatch] = useReducer(reducer, initialInteraction);
  return { interactionState, interactionDispatch: dispatch };
}

export { useInteraction };
