import { inViewPort } from '../util';
import type {
  PanScaleState,
  InteractionState,
  RevisOptions,
  RevisScreen,
  RevisShapeDefinition,
  NodeDrawingFunction,
  ShapeDrawingFunction,
  RevisImageMap,
} from '../types';
import type { RevisNode, RevisEdge } from '../components';

const MS_PER_RENDER = 30;

const DEFAULT_SHAPE_STYLE = {
  fill: '#ffffff',
  stroke: '#333333',
  lineWidth: 2,
  font: '16px lato, Arial',
};

// ── Drawing state ─────────────────────────────────────────────────────────────

/**
 * Snapshot of engine state consumed by the draw functions each frame.
 */
export interface RenderState {
  panScale: PanScaleState;
  interaction: InteractionState;
  nodes: Map<string, RevisNode>;
  edges: Map<string, RevisEdge>;
  shapes: RevisShapeDefinition[];
  screen: RevisScreen;
  options: RevisOptions;
  rollover: RevisNode | RevisEdge | null;
  images: RevisImageMap;
  nodeDrawingFunction?: NodeDrawingFunction;
  shapeDrawingFunction?: ShapeDrawingFunction;
}

/**
 * The three drawing canvases required by the render loop.
 * A fourth (hover) canvas exists in the React layout but is not drawn
 * into by the loop — it is reserved for future use.
 */
export interface RenderLoopCanvases {
  shapes: HTMLCanvasElement;
  edges: HTMLCanvasElement;
  nodes: HTMLCanvasElement;
}

// ── Pure draw functions ───────────────────────────────────────────────────────

/**
 * Draws background shapes onto the shapes canvas.
 */
export function drawShapes(
  canvas: HTMLCanvasElement,
  state: RenderState,
  drawingFunction: ShapeDrawingFunction | null
): boolean {
  const { shapes, panScale, screen, images } = state;
  if (!shapes || !canvas) return false;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const { scale, pan } = panScale;
  const { width, height } = screen;
  ctx.save();
  ctx.clearRect(0, 0, width as number, height as number);
  ctx.transform(scale, 0, 0, scale, pan.x, pan.y);
  shapes.forEach((i: RevisShapeDefinition) => {
    if (i.visible !== false) {
      const style = { ...DEFAULT_SHAPE_STYLE, ...(i.style || {}) };
      ctx.save();
      ctx.translate(i.x, i.y);
      ctx.lineWidth = style.lineWidth;
      ctx.fillStyle = style.background || style.fillColor || style.fill;
      ctx.strokeStyle = (style.border || style.strokeColor || style.stroke || style.line) as string;
      ctx.beginPath();
      if (drawingFunction) {
        drawingFunction(ctx, i);
      } else {
        ctx.fillRect(0, 0, i.width || i.size || 0, i.height || i.size || 0);
      }
      if (i.shape && i.shape !== 'image') {
        ctx.closePath();
        if (style && style.fill !== null) ctx.fill();
        ctx.stroke();
      } else if (i.mapImageId || i.imageId || i.image) {
        const imageData = images[i.mapImageId!] || images[i.imageId!] || i.image;
        if (
          imageData &&
          (imageData instanceof HTMLImageElement ||
            imageData instanceof SVGImageElement ||
            imageData instanceof HTMLCanvasElement)
        ) {
          const sc = i.scale || 1;
          ctx.drawImage(imageData, 0, 0, (i.width || i.size || 0) * sc, (i.height || i.size || 0) * sc);
        }
      }
      ctx.restore();
    }
  });
  ctx.restore();
  return true;
}

/**
 * Draws nodes or edges onto a canvas. Pass `cull: true` for nodes to skip
 * off-screen items; pass `cull: false` for edges (always draw all).
 */
export function drawObjects(
  items: IterableIterator<RevisNode | RevisEdge>,
  canvas: HTMLCanvasElement,
  state: RenderState,
  drawingFunction: NodeDrawingFunction | null,
  cull: boolean
): boolean {
  if (!items || !canvas) return false;
  const { panScale, options, rollover, images, screen } = state;
  const { scale, pan } = panScale;
  const { width, height } = screen;

  const viewPort = {
    left: (-10 - pan.x) / scale,
    top: (-10 - pan.y) / scale,
    right: (10 + (width as number) - pan.x) / scale,
    bottom: (10 + (height as number) - pan.y) / scale,
  };

  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.save();
  ctx.clearRect(0, 0, width as number, height as number);
  ctx.transform(scale, 0, 0, scale, pan.x, pan.y);

  const st = { ...panScale, options, rolloverItem: rollover };
  for (const item of items) {
    if (
      item.render !== undefined &&
      (!cull || (item as RevisNode).destination || inViewPort(item as RevisNode, viewPort))
    ) {
      item.render(st, ctx, images, drawingFunction);
    }
  }
  ctx.restore();
  return true;
}

// ── RenderLoop ────────────────────────────────────────────────────────────────

/**
 * RenderLoop drives a ~30fps requestAnimationFrame loop that:
 *  - calls onTick() every frame (engine processes key/zoom/pan animations)
 *  - calls draw() when dirty or when an animation is in progress
 *
 * Mark the loop dirty whenever engine state changes:
 *   const unsub = engine.subscribe(() => loop.markDirty());
 *
 * Call stop() to cancel the loop (e.g. on component unmount).
 */
export class RenderLoop {
  private readonly canvases: RenderLoopCanvases;
  private readonly getState: () => RenderState;
  private readonly onTick: () => void;

  private animRequest: number = 0;
  private lastFrameTime: number = 0;
  private dirty: boolean = true;

  constructor(
    canvases: RenderLoopCanvases,
    getState: () => RenderState,
    onTick: () => void
  ) {
    this.canvases = canvases;
    this.getState = getState;
    this.onTick = onTick;
    this.animRequest = window.requestAnimationFrame((t) => this.loop(t));
  }

  markDirty(): void {
    this.dirty = true;
  }

  stop(): void {
    window.cancelAnimationFrame(this.animRequest);
  }

  private loop(elapsedTime: number): void {
    const delta = elapsedTime - (this.lastFrameTime || 0);
    this.animRequest = window.requestAnimationFrame((t) => this.loop(t));

    if (this.lastFrameTime && delta < MS_PER_RENDER) return;

    this.lastFrameTime = elapsedTime;
    this.onTick();

    const state = this.getState();
    const { panScale, interaction } = state;

    if (this.dirty || interaction.action || panScale.destinationPan || panScale.destinationScale) {
      this.draw(state);
      this.dirty = false;
    }
  }

  private draw(state: RenderState): void {
    drawShapes(this.canvases.shapes, state, state.shapeDrawingFunction ?? null);
    drawObjects(state.edges.values(), this.canvases.edges, state, null, false);
    drawObjects(state.nodes.values(), this.canvases.nodes, state, state.nodeDrawingFunction ?? null, true);
  }
}
