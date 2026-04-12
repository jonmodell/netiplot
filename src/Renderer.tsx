/* eslint-disable no-param-reassign, no-unused-expressions, no-undef */
import React, { useEffect, useState } from "react";
import "./styles.css";
import { ZoomControls, HoverPopup } from "./components";
import { ActionLayer, EditLayer } from "./renderingLayers";
import { RendererProps, DrawingBounds, PanScaleState, ShapeDrawingFunction, NodeDrawingFunction, RevisShapeDefinition } from "./types";
import { inViewPort } from "./util";

const MS_PER_RENDER = 30;

const DEFAULT_SHAPE_STYLE = {
  fill: "#ffffff",
  stroke: "#333333",
  lineWidth: 2,
  font: "16px lato, Arial",
};

const Renderer = (props: RendererProps) => {
  const nodesRef = React.createRef<HTMLCanvasElement>();
  const edgesRef = React.createRef<HTMLCanvasElement>();
  const shapesRef = React.createRef<HTMLCanvasElement>();
  const containerRef = React.createRef<HTMLDivElement>();
  const hoverRef = React.createRef<HTMLCanvasElement>();

  let lastFrameTime: number = 0;
  let animRequest: number = 0;
  let lastScale = null;
  let lastRollOver = props.rolloverState;
  let lastScreen = null;
  let lastOptions = null;
  const [dirty, setDirty] = useState<boolean | null>(null);

  // loop starter hook
  useEffect(() => {
    loop();
    return () => {
      window.cancelAnimationFrame(animRequest);
    };
  });

  // sets dirty === true whenever the props change
  useEffect(() => {
    setDirty(true);
  }, [props])

  // drawing hook
  const draw = () => {
    const ndf = props.nodeDrawingFunction || null;
    const sdf = props.shapeDrawingFunction || null;
    // shapes
    drawShapes(props.shapes, shapesRef, sdf);
    // edges
    drawObjects(props.edges.values(), edgesRef, null);
    // nodes
    drawObjects(props.nodes.values(), nodesRef, ndf);
  };

  const loop = (elapsedTime = 0) => {
    const delta = elapsedTime - (lastFrameTime || 0);
    const { handlers } = props;

    const lp = loop;
    animRequest = window.requestAnimationFrame(lp);

    if (lastFrameTime && delta < MS_PER_RENDER) {
      return;
    }

    lastFrameTime = elapsedTime;

    handlers && handlers("tick");

    const ps = props.panScaleState;
    const is = props.interactionState;
    if (dirty || is.action || ps.destinationPan || ps.destinationScale) {
      draw();
      setDirty(false);
    }
  };

  const drawBounds = (
    bounds: DrawingBounds,
    shapesRef: React.RefObject<HTMLCanvasElement>,
    panScaleState: PanScaleState
  ) => {
    if (!bounds || !shapesRef.current) return false;
    const ctx: CanvasRenderingContext2D | null = shapesRef.current.getContext("2d");
    const { scale, pan } = panScaleState;
    ctx!.save();
    ctx!.transform(scale, 0, 0, scale, pan.x, pan.y);
    ctx!.fillStyle = "rgba(0,0,0,0.2)";
    ctx!.strokeStyle = "#222222";
    ctx!.beginPath();
    ctx!.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
    ctx!.closePath();
    ctx!.stroke();
    ctx!.restore();
    return true;
  };

  const drawShapes = (items: RevisShapeDefinition[] | Map<string, RevisShapeDefinition>, ref: React.RefObject<HTMLCanvasElement>, drawingFunction: ShapeDrawingFunction | null) => {
    if (!items || !ref.current) return false;
    const ctx = ref.current!.getContext("2d");
    const { panScaleState, screen, images } = props;
    const { scale, pan } = panScaleState;
    const { width, height } = screen;
    ctx!.save();
    ctx!.clearRect(0, 0, width as number, height as number);
    ctx!.transform(scale, 0, 0, scale, pan.x, pan.y);
    items.forEach((i: RevisShapeDefinition) => {
      if (i.visible !== false) {
        const style = { ...DEFAULT_SHAPE_STYLE, ...(i.style || {}) };
        ctx!.save();
        ctx!.translate(i.x, i.y);
        ctx!.lineWidth = style.lineWidth;
        ctx!.fillStyle = style.background || style.fillColor || style.fill;
        ctx!.strokeStyle =
          (style.border || style.strokeColor || style.stroke || style.line) as string;
        ctx!.beginPath();
        if (drawingFunction) {
          drawingFunction(ctx!, i);
        } else {
          ctx!.fillRect(0, 0, i.width || i.size || 0, i.height || i.size || 0);
        }

        if (i.shape && i.shape !== "image") {
          ctx!.closePath();
          if (style && style.fill !== null) {
            ctx!.fill();
          }
          ctx!.stroke();
        } else if (i.mapImageId || i.imageId || i.image) {
          const imageData =
            images[i.mapImageId!] || images[i.imageId!] || i.image;
          if (
            imageData &&
            (imageData instanceof HTMLImageElement ||
              imageData instanceof SVGImageElement ||
              imageData instanceof HTMLCanvasElement)
          ) {
            const sc = i.scale || 1;
            ctx!.drawImage(imageData, 0, 0, (i.width || i.size || 0) * sc, (i.height || i.size || 0) * sc);
          }
        }

        ctx!.restore();
      }
    });
    ctx!.restore();
    return true;
  };

  // Items are RevisNode or RevisEdge instances with different render() signatures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawObjects = (items: IterableIterator<any>, ref: React.RefObject<HTMLCanvasElement>, drawingFunction: NodeDrawingFunction | null) => {
    const { panScaleState, options, rolloverState, images, screen } = props;

    if (!items || !ref.current) return false;

    const { scale, pan } = panScaleState;
    const { width, height } = screen;
    const viewPort = {
      left: (-10 - pan.x) / scale,
      top: (-10 - pan.y) / scale,
      right: (10 + (width as number) - pan.x) / scale,
      bottom: (10 + (height as number) - pan.y) / scale,
    };

    const context = ref.current!.getContext("2d");
    context!.save();
    context!.clearRect(0, 0, width as number, height as number);
    context!.transform(scale, 0, 0, scale, pan.x, pan.y);
    const st = {
      ...panScaleState,
      options,
      rolloverItem: rolloverState,
    };

    for (const item of items) {
      if (
        item.render !== undefined &&
        (ref !== nodesRef ||
          item.destination ||
          inViewPort(item, viewPort))
      ) {
        item.render(st, context, images, drawingFunction);
      }
    }
    context!.restore();
    return true;
  };

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
