import React, { useEffect, useRef, useCallback } from 'react';
import './styles.css';
import { ZoomControls, HoverPopup } from './components';
import { ActionLayer, EditLayer } from './renderingLayers';
import { RendererProps } from './types';
import { RenderLoop, RenderState } from './core/RenderLoop';

const Renderer = (props: RendererProps) => {
  const nodesRef = useRef<HTMLCanvasElement>(null);
  const edgesRef = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderLoopRef = useRef<RenderLoop | null>(null);

  // Always-fresh props snapshot for the render loop's getState callback
  const propsRef = useRef(props);
  propsRef.current = props;

  const getState = useCallback((): RenderState => {
    const p = propsRef.current;
    return {
      panScale: p.panScaleState,
      interaction: p.interactionState,
      nodes: p.nodes,
      edges: p.edges,
      shapes: p.shapes,
      screen: p.screen,
      options: p.options,
      rollover: p.rolloverState,
      images: p.images,
      nodeDrawingFunction: p.nodeDrawingFunction,
      shapeDrawingFunction: p.shapeDrawingFunction,
    };
  }, []);

  // Create RenderLoop once when canvases are available
  useEffect(() => {
    if (!shapesRef.current || !edgesRef.current || !nodesRef.current) return;
    const loop = new RenderLoop(
      { shapes: shapesRef.current, edges: edgesRef.current, nodes: nodesRef.current },
      getState,
      () => propsRef.current.handlers?.('tick')
    );
    renderLoopRef.current = loop;
    return () => loop.stop();
  }, []);

  // Mark loop dirty whenever props change (runs after every render)
  useEffect(() => {
    renderLoopRef.current?.markDirty();
  });

  const {
    className,
    customControls,
    screen,
    hoverState,
    clearHover,
    handlers,
    handleKey,
    handleMouse,
    handleMouseWheel,
    handleZoom,
    options,
    panScaleState,
    interactionState,
    uid,
    shapes,
  } = props;

  const hideControls = customControls === null;
  const { width, height } = screen;

  return (
    <div ref={containerRef} className={`revis-container ${className || ''}`} key={uid.current}>
      <>
        <canvas ref={shapesRef} width={width} height={height} tabIndex={-4} />
        <canvas ref={edgesRef} width={width} height={height} tabIndex={-3} />
        <canvas ref={nodesRef} width={width} height={height} tabIndex={-0} />
        <canvas ref={hoverRef} width={width} height={height} tabIndex={-1} />

        <EditLayer
          showMutedOverlay={options.showMutedOverlay || false}
          shapes={shapes}
          interactionState={interactionState}
          screen={screen}
          panScaleState={panScaleState}
        />

        <ActionLayer
          handlers={handlers}
          handleMouse={handleMouse}
          handleMouseWheel={handleMouseWheel}
          handleKey={handleKey}
        />
      </>

      <HoverPopup
        tracking={hoverState}
        options={options.hover}
        clearHover={() => clearHover()}
      />

      {!hideControls && (
        <ZoomControls customControls={customControls} zoom={handleZoom} />
      )}
    </div>
  );
};

export { Renderer };
