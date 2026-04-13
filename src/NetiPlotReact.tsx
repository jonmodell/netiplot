import React, { useRef, useEffect, useCallback, useSyncExternalStore, memo } from 'react';
import { deepMerge, getBounds, getNodePositions } from './util';
import { defaultLayout } from './layout';
import { defaultOptions } from './options';
import { Renderer } from './Renderer';
import { NetiplotEngine } from './core/NetiplotEngine';
import { NetiPlotProps } from './types';

const NetiPlotReactBase = (props: NetiPlotProps) => {
  const {
    callbackFn,
    className,
    customControls,
    graph,
    identifier,
    images,
    layouter = defaultLayout,
    nodeDrawingFunction,
    onMouse,
    options,
    shapeDrawingFunction,
    shapes,
    shouldRunLayouter,
  } = props;

  // Keep onMouse stable so the engine doesn't need a setter for it
  const onMouseRef = useRef(onMouse);
  onMouseRef.current = onMouse;
  const stableOnMouse = useCallback(
    (...args: Parameters<NonNullable<typeof onMouse>>) => onMouseRef.current?.(...args),
    []
  );

  // Create engine exactly once (lazy ref initialisation)
  const engineRef = useRef<NetiplotEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new NetiplotEngine({
      graph,
      options,
      shapes,
      layouter,
      shouldRunLayouter,
      onMouse: stableOnMouse,
      nodeDrawingFunction,
      shapeDrawingFunction,
      images,
      identifier,
    });
  }
  const engine = engineRef.current;

  // useSyncExternalStore is the React 18 canonical way to subscribe to an
  // external store. Combined with the engine's snapshot cache (getState()
  // returns the same object between notify() calls), React bails out of
  // re-renders when nothing has actually changed — preventing infinite loops
  // caused by inline prop objects or frequent tick()-driven notifications.
  const engineState = useSyncExternalStore(
    useCallback((onStoreChange) => engine.subscribe(onStoreChange), [engine]),
    useCallback(() => engine.getState(), [engine])
  );

  // Destroy on unmount
  useEffect(() => () => engine.destroy(), []);

  // Sync changing props → engine
  useEffect(() => { engine.setGraph(graph, shapes); }, [graph, shapes]);
  useEffect(() => { if (options) engine.setOptions(options); }, [options]);
  useEffect(() => { engine.setLayouter(layouter); }, [layouter]);

  // callbackFn — re-expose API whenever camera changes
  useEffect(() => {
    callbackFn?.({
      nodes: { current: engine.nodes } as React.RefObject<any>,
      getNodePositions,
      getPositions: () => engine.getNodePositions(),
      getCamera: () => engine.getCamera(),
      fit: () => engine.zoomToFit(),
    });
  }, [engineState.panScale]);

  const handlers = useCallback((type: string, payload?: HTMLCanvasElement | null) => {
    if (type === 'resize') engine.handleResize(payload || null);
    if (type === 'tick') engine.tick();
    return true;
  }, []);

  const handleZoomClick = useCallback(
    (e: { preventDefault: () => void }, level: string) => {
      e.preventDefault();
      engine.zoom(level);
    },
    []
  );

  const { nodes, edges } = engineState;
  const mergedOptions = deepMerge({}, defaultOptions, engineState.options);

  return (
    <Renderer
      bounds={getBounds(Array.from(nodes.values()), shapes)}
      className={className}
      clearHover={() => engine.clearHover()}
      customControls={customControls}
      edges={edges}
      handleKey={(e) => engine.handleKey(e)}
      handleMouse={(e) => engine.handleMouse(e)}
      handleMouseWheel={(e) => engine.handleMouseWheel(e)}
      handlers={handlers}
      handleZoom={handleZoomClick}
      hoverState={engineState.hover}
      images={images || {}}
      interactionState={engineState.interaction}
      nodes={nodes}
      nodeDrawingFunction={nodeDrawingFunction}
      options={mergedOptions}
      panScaleState={engineState.panScale}
      rolloverState={engineState.rollover}
      screen={engineState.screen}
      shapes={shapes || []}
      shapeDrawingFunction={shapeDrawingFunction}
      uid={{ current: engine.uid } as React.RefObject<string>}
    />
  );
};

const NetiPlotReact = memo(NetiPlotReactBase);
export { NetiPlotReact };
