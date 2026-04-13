import { deepMerge } from '../util';
import { defaultLayout } from '../layout';
import { NetiplotEngine } from '../core/NetiplotEngine';
import { EventManager } from '../core/EventManager';
import { RenderLoop, RenderState } from '../core/RenderLoop';
import type {
  NetiPlotGraph,
  NetiPlotShapeDefinition,
  NetiPlotOptions,
  NetiPlotLayouter,
  ShouldRunLayouter,
  NetiPlotMouseHandler,
  NodeDrawingFunction,
  ShapeDrawingFunction,
  NetiPlotImageMap,
  PanScaleState,
  HoverState,
  NetiPlotNodeDefinition,
  NetiPlotEdgeDefinition,
} from '../types';

// ── Vanilla hover config ───────────────────────────────────────────────────────

/**
 * Vanilla hover configuration. Unlike the React version (which uses React renderers),
 * the vanilla hover uses callbacks that return an HTMLElement or an HTML string.
 */
export interface NetiplotHoverConfig {
  /** Return an HTMLElement or HTML string to display when hovering a node, or null to suppress. */
  nodeRenderer?: (node: NetiPlotNodeDefinition) => HTMLElement | string | null;
  /** Return an HTMLElement or HTML string to display when hovering an edge, or null to suppress. */
  edgeRenderer?: (edge: NetiPlotEdgeDefinition) => HTMLElement | string | null;
  /** Hover delay in milliseconds (default: 750). */
  delay?: number;
  /** Tooltip width in px used for positioning (default: 200). */
  width?: number;
  /** Tooltip height in px used for positioning (default: 150). */
  height?: number;
}

// ── Netiplot config ───────────────────────────────────────────────────────────

export interface NetiplotConfig {
  /** Graph data. */
  graph: NetiPlotGraph;
  /** Library options (nodes, edges, camera, layout, interaction, etc.). */
  options?: NetiPlotOptions;
  /** Background shapes. */
  shapes?: NetiPlotShapeDefinition[];
  /** Layout algorithm (defaults to built-in hierarchical layout). */
  layouter?: NetiPlotLayouter;
  /** Predicate controlling whether layout re-runs on graph change. */
  shouldRunLayouter?: ShouldRunLayouter;
  /** Mouse event callback. */
  onMouse?: NetiPlotMouseHandler;
  /** Custom node drawing function. */
  nodeDrawingFunction?: NodeDrawingFunction;
  /** Custom shape drawing function. */
  shapeDrawingFunction?: ShapeDrawingFunction;
  /** Map of image IDs to image elements. */
  images?: NetiPlotImageMap;
  /** Stable identifier for this instance. */
  identifier?: string;
  /** Vanilla hover tooltip configuration (callback-based, no React). */
  hover?: NetiplotHoverConfig;
}

// ── Netiplot ──────────────────────────────────────────────────────────────────

/**
 * Vanilla JS network visualization. Drop-in alternative to <NetiPlotReact> for
 * non-React environments.
 *
 * Usage:
 *   const net = new Netiplot(containerElement, { graph: { nodes: [], edges: [] } });
 *   net.setGraph({ nodes, edges });
 *   net.zoom('all');
 *   net.destroy();
 */
export class Netiplot {
  private readonly engine: NetiplotEngine;
  private readonly renderLoop: RenderLoop;
  private readonly eventManager: EventManager;
  private readonly unsubscribe: () => void;

  // Canvas layers
  private readonly shapesCanvas: HTMLCanvasElement;
  private readonly edgesCanvas: HTMLCanvasElement;
  private readonly nodesCanvas: HTMLCanvasElement;
  private readonly hoverCanvas: HTMLCanvasElement;
  private readonly actionCanvas: HTMLCanvasElement;

  // Hover tooltip
  private readonly tooltip: HTMLDivElement;
  private readonly hoverConfig?: NetiplotHoverConfig;

  // True after the first ResizeObserver callback that reports a non-zero screen.
  // zoomToFit() called in the engine constructor uses a 0×0 screen (layout hasn't
  // happened yet), so we re-fit once we know the real dimensions.
  private screenReady = false;

  constructor(container: HTMLElement, config: NetiplotConfig) {
    this.hoverConfig = config.hover;

    // Ensure container can contain absolutely-positioned children.
    // getComputedStyle returns '' for detached elements in jsdom, so treat
    // empty string the same as 'static'.
    const pos = window.getComputedStyle(container).position;
    if (!pos || pos === 'static') container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // ── Canvas layers (order = z-index: shapes → edges → nodes → hover → action)
    this.shapesCanvas = createCanvas(container, 'netiplot-shapes');
    this.edgesCanvas = createCanvas(container, 'netiplot-edges');
    this.nodesCanvas = createCanvas(container, 'netiplot-nodes');
    this.hoverCanvas = createCanvas(container, 'netiplot-hover');
    this.actionCanvas = createCanvas(container, 'netiplot-action');
    this.actionCanvas.tabIndex = 0;
    this.actionCanvas.style.cursor = 'default';
    this.actionCanvas.style.outline = 'none';

    // ── Hover tooltip div
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'netiplot-tooltip';
    Object.assign(this.tooltip.style, {
      position: 'absolute',
      zIndex: '10',
      pointerEvents: 'none',
      display: 'none',
    });
    container.appendChild(this.tooltip);

    // ── Build merged options so hover delay/size pass through to the engine
    const mergedOptions: NetiPlotOptions = deepMerge({}, config.options || {}, {
      hover: {
        delay: config.hover?.delay,
        width: config.hover?.width,
        height: config.hover?.height,
      },
    });

    // ── Engine (holds all state and business logic)
    this.engine = new NetiplotEngine({
      graph: config.graph,
      options: mergedOptions,
      shapes: config.shapes,
      layouter: config.layouter ?? defaultLayout,
      shouldRunLayouter: config.shouldRunLayouter,
      onMouse: config.onMouse,
      nodeDrawingFunction: config.nodeDrawingFunction,
      shapeDrawingFunction: config.shapeDrawingFunction,
      images: config.images,
      identifier: config.identifier,
    });

    // ── RenderLoop (drives RAF + canvas draw — must be created before subscribing)
    this.renderLoop = new RenderLoop(
      { shapes: this.shapesCanvas, edges: this.edgesCanvas, nodes: this.nodesCanvas },
      () => this.buildRenderState(),
      () => this.engine.tick()
    );

    // ── Subscribe to engine state changes
    this.unsubscribe = this.engine.subscribe(() => this.onEngineChange());

    // ── EventManager (fires initial resize on construction — subscribe must be set up first)
    this.eventManager = new EventManager(this.actionCanvas, this.engine);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private buildRenderState(): RenderState {
    const s = this.engine.getState();
    return {
      panScale: s.panScale,
      interaction: s.interaction,
      nodes: s.nodes,
      edges: s.edges,
      shapes: s.shapes,
      screen: s.screen,
      options: s.options,
      rollover: s.rollover,
      images: s.images,
      nodeDrawingFunction: s.nodeDrawingFunction,
      shapeDrawingFunction: s.shapeDrawingFunction,
    };
  }

  private onEngineChange(): void {
    const { screen, hover } = this.engine.getState();

    // Sync canvas pixel dimensions with the screen reported by the engine
    const w = screen.width as number | undefined;
    const h = screen.height as number | undefined;
    if (w && h) {
      for (const canvas of [
        this.shapesCanvas,
        this.edgesCanvas,
        this.nodesCanvas,
        this.hoverCanvas,
        this.actionCanvas,
      ]) {
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
      }

      // First time we get a real screen size: re-run the layout so node
      // positions use actual screen dimensions (the initial layout in the
      // engine constructor ran with width=undefined, causing NaN positions
      // when spaceNodesByScreenSize is enabled). The layouter calls
      // zoomToFit() via its onStopped callback, so we don't need to call
      // it separately.
      if (!this.screenReady) {
        this.screenReady = true;
        this.engine.relayout();
      }
    }

    this.updateTooltip(hover);
    this.renderLoop.markDirty();
  }

  private updateTooltip(hover: HoverState): void {
    if (!hover.item || !this.hoverConfig) {
      this.tooltip.style.display = 'none';
      this.tooltip.innerHTML = '';
      return;
    }

    const renderer =
      hover.itemType === 'node'
        ? this.hoverConfig.nodeRenderer
        : this.hoverConfig.edgeRenderer;

    if (!renderer) {
      this.tooltip.style.display = 'none';
      return;
    }

    const content = renderer(hover.item as NetiPlotNodeDefinition & NetiPlotEdgeDefinition);
    if (!content) {
      this.tooltip.style.display = 'none';
      return;
    }

    this.tooltip.innerHTML = '';
    if (typeof content === 'string') {
      this.tooltip.innerHTML = content;
    } else {
      this.tooltip.appendChild(content);
    }

    if (hover.popupPosition) {
      this.tooltip.style.left = `${hover.popupPosition.x}px`;
      this.tooltip.style.top = `${hover.popupPosition.y}px`;
    }

    this.tooltip.style.display = 'block';
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Replace the graph data. Triggers layout if nodes/edges changed. */
  setGraph(graph: NetiPlotGraph, shapes?: NetiPlotShapeDefinition[]): this {
    this.engine.setGraph(graph, shapes);
    return this;
  }

  /** Update options. Triggers layout if layoutOptions changed. */
  setOptions(options: NetiPlotOptions): this {
    this.engine.setOptions(options);
    return this;
  }

  /**
   * Programmatic zoom. Level: 'in' | 'out' | 'all' | 'selection'.
   * Equivalent to clicking the zoom control buttons.
   */
  zoom(level: string): this {
    this.engine.zoom(level);
    return this;
  }

  /** Fit all nodes into view with optional padding. */
  fit(): this {
    this.engine.zoomToFit();
    return this;
  }

  /** Returns the current camera state (pan + scale). */
  getCamera(): PanScaleState {
    return this.engine.getCamera();
  }

  /** Returns a map of node id → { x, y } positions. */
  getNodePositions(): Record<string, { x: number; y: number }> {
    return this.engine.getNodePositions();
  }

  /**
   * Tear down the instance: stops the render loop, removes event listeners,
   * destroys the engine, and removes all DOM elements created by Netiplot.
   */
  destroy(): void {
    this.unsubscribe();
    this.renderLoop.stop();
    this.eventManager.destroy();
    this.engine.destroy();
    for (const el of [
      this.shapesCanvas,
      this.edgesCanvas,
      this.nodesCanvas,
      this.hoverCanvas,
      this.actionCanvas,
      this.tooltip,
    ]) {
      el.remove();
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function createCanvas(container: HTMLElement, className: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  Object.assign(canvas.style, {
    display: 'block',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    width: '100%',
    height: '100%',
  });
  container.appendChild(canvas);
  return canvas;
}
