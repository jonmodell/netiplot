import {
  deepEqual,
  deepMerge,
  getBounds,
  getBoundsScale,
  getEdgeAtPosition,
  getFitToScreen,
  getHoverPos,
  getKeyAction,
  getMousePos,
  getNodeAtPosition,
  getNodePositions,
  getNodeScreenPos,
  getScreenEdgePan,
  getPanScaleFromMouseWheel,
  getShapeAtPos,
  getHandleAtPos,
  setShapeByHandleDrag,
} from '../util';
import { defaultLayout } from '../layout';
import { defaultOptions } from '../options';
import { RevisNode, RevisEdge } from '../components';
import { panScaleReducer, initialPanScaleState } from './panScaleState';
import { interactionReducer, initialInteraction } from './interactionState';
import type { PanScaleAction } from './panScaleState';
import type { InteractionAction } from './interactionState';
import type {
  RevisGraph,
  RevisShapeDefinition,
  RevisNodeDefinition,
  RevisEdgeDefinition,
  RevisLayouterResult,
  RevisOptions,
  RevisScreen,
  PanScaleState,
  InteractionState,
  HoverState,
  RevisLayouter,
  ShouldRunLayouter,
  RevisMouseHandler,
  NodeDrawingFunction,
  ShapeDrawingFunction,
  RevisImageMap,
} from '../types';

interface MousePayload {
  pos: { x: number; y: number };
  ctrlClick: boolean;
  e: MouseEvent;
}

export interface NetiplotEngineConfig {
  graph: RevisGraph;
  options?: RevisOptions;
  shapes?: RevisShapeDefinition[];
  layouter?: RevisLayouter;
  shouldRunLayouter?: ShouldRunLayouter;
  onMouse?: RevisMouseHandler;
  nodeDrawingFunction?: NodeDrawingFunction;
  shapeDrawingFunction?: ShapeDrawingFunction;
  images?: RevisImageMap;
  identifier?: string;
}

export interface NetiplotEngineState {
  panScale: PanScaleState;
  interaction: InteractionState;
  hover: HoverState;
  options: RevisOptions;
  screen: RevisScreen;
  nodes: Map<string, RevisNode>;
  edges: Map<string, RevisEdge>;
  shapes: RevisShapeDefinition[];
  rollover: RevisNode | RevisEdge | null;
  keyAction: string | null;
  nodeDrawingFunction?: NodeDrawingFunction;
  shapeDrawingFunction?: ShapeDrawingFunction;
  images: RevisImageMap;
}

export class NetiplotEngine {
  private panScale: PanScaleState = { ...initialPanScaleState };
  private interaction: InteractionState = { ...initialInteraction };
  private hover: HoverState = { item: null, itemType: null };
  private options: RevisOptions;
  private screen: RevisScreen = { width: 0, height: 0, ratio: 1, boundingRect: null };

  readonly nodes: Map<string, RevisNode> = new Map();
  readonly edges: Map<string, RevisEdge> = new Map();
  private shapes: RevisShapeDefinition[];
  private rollover: RevisNode | RevisEdge | null = null;
  private keyAction: string | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLayouterResult: RevisLayouterResult = null;
  private lastLayoutOptions: RevisOptions['layoutOptions'] = {};

  private layouter: RevisLayouter;
  private shouldRunLayouter?: ShouldRunLayouter;
  private onMouse?: RevisMouseHandler;

  readonly nodeDrawingFunction?: NodeDrawingFunction;
  readonly shapeDrawingFunction?: ShapeDrawingFunction;
  readonly images: RevisImageMap;
  readonly uid: string;

  private listeners = new Set<() => void>();

  constructor(config: NetiplotEngineConfig) {
    this.options = deepMerge({}, defaultOptions, config.options || {});
    this.shapes = config.shapes ? [...config.shapes] : [];
    this.layouter = config.layouter ?? defaultLayout;
    this.shouldRunLayouter = config.shouldRunLayouter;
    this.onMouse = config.onMouse;
    this.nodeDrawingFunction = config.nodeDrawingFunction;
    this.shapeDrawingFunction = config.shapeDrawingFunction;
    this.images = config.images ?? {};
    this.uid = config.identifier ?? 'netiplot-' + Math.random().toString(36).slice(2);

    if (config.graph) {
      this.syncGraph(config.graph, config.shapes);
    }
  }

  // ── State ──────────────────────────────────────────────────────────────────

  getState(): NetiplotEngineState {
    return {
      panScale: this.panScale,
      interaction: this.interaction,
      hover: this.hover,
      options: this.options,
      screen: this.screen,
      nodes: this.nodes,
      edges: this.edges,
      shapes: this.shapes,
      rollover: this.rollover,
      keyAction: this.keyAction,
      nodeDrawingFunction: this.nodeDrawingFunction,
      shapeDrawingFunction: this.shapeDrawingFunction,
      images: this.images,
    };
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  // ── Reducers ──────────────────────────────────────────────────────────────

  private dispatchPanScale(action: PanScaleAction): void {
    this.panScale = panScaleReducer(this.panScale, action);
    this.notify();
  }

  private dispatchInteraction(action: InteractionAction): void {
    this.interaction = interactionReducer(this.interaction, action);
    this.notify();
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  getCamera(): PanScaleState {
    return { ...this.panScale };
  }

  getNodePositions(): Record<string, { x: number; y: number }> {
    return getNodePositions(this.nodes);
  }

  private getLiveScreen(): RevisScreen {
    return {
      width: this.canvas?.clientWidth,
      height: this.canvas?.clientHeight,
      ratio: (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1,
      boundingRect: this.canvas?.getBoundingClientRect(),
    };
  }

  private getBounds() {
    return getBounds(Array.from(this.nodes.values()), this.shapes);
  }

  // ── Resize ────────────────────────────────────────────────────────────────

  handleResize(canvas: HTMLCanvasElement | null): boolean {
    if (!canvas) return false;
    this.canvas = canvas;
    this.screen = this.getLiveScreen();
    this.notify();
    return true;
  }

  // ── Hover ─────────────────────────────────────────────────────────────────

  clearHover(): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    if (this.hover.item) {
      this.hover = { item: null, itemType: null };
      this.notify();
    }
  }

  private setShowHover(
    item: RevisNodeDefinition | RevisEdgeDefinition,
    itemType: string,
    pos: { x: number; y: number }
  ): void {
    const delay = this.options?.hover?.delay ?? 750;
    const popupPosition = getHoverPos(pos, this.getLiveScreen(), this.panScale, this.options);
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      this.hover = { ...this.hover, item, itemType, popupPosition };
      this.notify();
    }, delay);
  }

  // ── Key handling ──────────────────────────────────────────────────────────

  handleKey(e: KeyboardEvent): boolean {
    if (e.defaultPrevented) return false;
    e.stopPropagation();
    const key = e.key || e.keyCode;
    const next = e.type === 'keydown' ? getKeyAction(key as string) : null;
    if (next !== this.keyAction) {
      this.keyAction = next;
      this.notify();
    }
    return true;
  }

  // ── Mouse ─────────────────────────────────────────────────────────────────

  handleMouse(e: MouseEvent): boolean {
    if (!this.getLiveScreen().boundingRect) return false;
    e.preventDefault();
    (e.target as HTMLElement)?.focus();
    const pos = getMousePos(e, this.getLiveScreen(), this.panScale);
    const ctrlClick = e.ctrlKey || e.metaKey || e.shiftKey;
    this.processMouseAction(e.type, { pos, ctrlClick, e });
    return true;
  }

  handleMouseWheel(e: WheelEvent): void {
    const st = getPanScaleFromMouseWheel(
      e,
      this.panScale,
      this.getLiveScreen(),
      this.getBounds(),
      this.options
    );
    this.dispatchPanScale({ type: 'set', payload: st });
    if (e) e.stopPropagation();
  }

  private processMouseAction(type: string, payload: MousePayload): boolean {
    const iOps = this.options.interaction;
    if (iOps?.allowGraphInteraction) {
      const iSt = this.interaction;
      const eventType = type === 'dblclick' ? 'dblclick' : type.substr(5);
      switch (eventType) {
        case 'down': {
          const { pos, ctrlClick, e } = payload;
          const draggedNodes = new Set<RevisNodeDefinition>(ctrlClick ? iSt.draggedNodes : []);
          const n = getNodeAtPosition(this.nodes, pos);
          const ed = getEdgeAtPosition(this.edges, pos, this.options.edges);
          if (n) {
            this.onMouse?.('nodeClick', n.definition, e);
            draggedNodes.add(n.definition);
            this.dispatchInteraction({ type: 'addToDrag', payload: Array.from(draggedNodes) });
          } else if (ed) {
            this.onMouse?.('edgeClick', ed.definition, e);
            this.dispatchInteraction({ type: 'edgeDown' });
          } else {
            this.dispatchInteraction({ type: 'pan' });
          }
          this.clearHover();
          break;
        }
        case 'up': {
          const { e } = payload;
          if (!iSt.draggedNodes.length && !iSt.mouseMoved && iSt.action !== 'edgeDown') {
            this.onMouse?.('backgroundClick', null, e);
          }
          if (iSt.draggedNodes.length && iSt.mouseMoved) {
            this.onMouse?.('nodesDragged', iSt.draggedNodes, e);
          }
          this.dispatchInteraction({ type: 'releaseDrag' });
          this.dispatchPanScale({ type: 'framePan', payload: null });
          break;
        }
        case 'move': {
          const { pos, e } = payload;
          if (iSt.action === 'drag' && iSt.draggedNodes.length > 0) {
            const lastNode = iSt.draggedNodes[iSt.draggedNodes.length - 1];
            const delta = {
              x: pos.x - Number(lastNode.x),
              y: pos.y - Number(lastNode.y),
            };
            iSt.draggedNodes.forEach((n: RevisNodeDefinition) => {
              n.x = (n.x || 0) + delta.x;
              n.y = (n.y || 0) + delta.y;
              n.fixed = true;
            });
            const sp = getScreenEdgePan(this.getLiveScreen(), e);
            this.dispatchInteraction({ type: 'mouseMoved' });
            this.dispatchPanScale({ type: 'framePan', payload: sp });
          } else if (iSt.action === 'pan') {
            const newPan = { ...this.panScale.pan };
            newPan.x += e.movementX;
            newPan.y += e.movementY;
            this.dispatchPanScale({ type: 'pan', payload: newPan });
          } else {
            const hn = getNodeAtPosition(this.nodes, pos);
            this.rollover = hn;
            if (hn) {
              if (hn.definition !== this.hover.item) {
                const nPos = getNodeScreenPos(hn, this.panScale);
                this.setShowHover(hn.definition, 'node', nPos);
              }
            } else {
              const he = getEdgeAtPosition(this.edges, pos, this.options.edges);
              if (he) {
                this.rollover = he;
                if (he.definition !== this.hover.item) {
                  const ePos = { x: e.clientX, y: e.clientY };
                  this.setShowHover(he.definition, 'edge', ePos);
                }
              } else {
                if (this.hoverTimer) clearTimeout(this.hoverTimer);
                this.rollover = null;
              }
            }
            this.notify();
          }
          break;
        }
        case 'leave': {
          this.dispatchPanScale({ type: 'framePan', payload: null });
          this.dispatchInteraction({ type: 'releaseDrag' });
          break;
        }
        case 'dblclick': {
          const n = getNodeAtPosition(this.nodes, payload.pos);
          if (n) {
            this.onMouse?.('nodeDblClick', n.definition, payload.e);
            break;
          }
          const edge = getEdgeAtPosition(this.edges, payload.pos, this.options.edges);
          if (edge) {
            this.onMouse?.('edgeDblClick', edge.definition, payload.e);
            break;
          }
          const syntheticWheelEvent = Object.create(payload.e, {
            deltaY: { value: -150 },
          }) as WheelEvent;
          const { pan, scale } = getPanScaleFromMouseWheel(
            syntheticWheelEvent,
            this.panScale,
            this.getLiveScreen(),
            this.getBounds(),
            this.options
          );
          this.dispatchPanScale({ type: 'destination', payload: { pan, scale } });
          break;
        }
        default:
          break;
      }
      return true;
    }
    if (iOps?.allowShapeInteraction) {
      this.processShapeEdit(type, payload);
    }
    return true;
  }

  private processShapeEdit(type: string, payload: MousePayload): void {
    const { pos, ctrlClick, e } = payload;
    const iSt = this.interaction;
    const eventType = type === 'dblclick' ? 'dblclick' : type.substr(5);
    switch (eventType) {
      case 'down': {
        if (iSt.shape) {
          const handle = getHandleAtPos(iSt.shape, pos, this.panScale.scale);
          if (handle) {
            this.dispatchInteraction({ type: 'handleDown', payload: handle });
            break;
          }
        }
        const shape = getShapeAtPos(this.shapes, pos);
        if (shape) {
          this.onMouse?.('shapeClick', shape, e);
          const idx = this.shapes.indexOf(shape);
          if (idx !== -1) {
            this.shapes.splice(idx, 1);
            this.shapes.push(shape);
          }
          this.dispatchInteraction({ type: 'shapeDown', payload: shape });
        } else {
          this.onMouse?.('backgroundClick');
          this.dispatchInteraction({ type: 'pan' });
        }
        break;
      }
      case 'up': {
        if (iSt.shape && iSt.mouseMoved) {
          this.onMouse?.('shapeUpdate', [...this.shapes], e);
        }
        this.dispatchInteraction({ type: 'shapeUp' });
        this.dispatchPanScale({ type: 'framePan', payload: null });
        break;
      }
      case 'move': {
        if (iSt.action === 'pan') {
          const newPan = { ...this.panScale.pan };
          newPan.x += e.movementX;
          newPan.y += e.movementY;
          this.dispatchPanScale({ type: 'pan', payload: newPan });
          break;
        }
        if (iSt.action === 'shapeDrag' && iSt.shape && iSt.shape.noEdit !== true) {
          iSt.shape.x = Number(iSt.shape.x) + e.movementX / this.panScale.scale;
          iSt.shape.y = Number(iSt.shape.y) + e.movementY / this.panScale.scale;
          this.dispatchInteraction({ type: 'shapeMove' });
        }
        if (
          iSt.action === 'handleDrag' &&
          iSt.shape &&
          iSt.shape.noEdit !== true &&
          iSt.shapeHandle
        ) {
          const changes = setShapeByHandleDrag(
            iSt.shape,
            iSt.shapeHandle,
            { x: e.movementX / this.panScale.scale, y: e.movementY / this.panScale.scale },
            ctrlClick
          );
          iSt.shape.x = changes.x;
          iSt.shape.y = changes.y;
          iSt.shape.width = changes.width;
          iSt.shape.height = changes.height;
          this.dispatchInteraction({ type: 'handleMove' });
        }
        break;
      }
      case 'dblclick': {
        const shape = getShapeAtPos(this.shapes, pos);
        if (shape) this.onMouse?.('shapeDblClick', shape, e);
        break;
      }
      case 'leave':
        break;
      default:
        break;
    }
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────

  zoom(level: string): boolean {
    const scr = this.getLiveScreen();
    const bds = this.getBounds();
    const newScale = getBoundsScale(scr.height, scr.width, bds, this.options);
    switch (level) {
      case 'in':
        this.dispatchPanScale({ type: 'zoomIn', payload: { screen: scr, bounds: bds } });
        break;
      case 'out':
        this.dispatchPanScale({ type: 'zoomOut', payload: { screen: scr, newScale, bounds: bds } });
        break;
      case 'all':
        this.zoomToFit();
        break;
      case 'selection': {
        const dn = this.interaction.draggedNodes[0] ?? null;
        if (dn) {
          this.dispatchPanScale({
            type: 'zoomSelection',
            payload: { screen: scr, dn: { x: dn.x || 0, y: dn.y || 0 } },
          });
        }
        break;
      }
      default:
        break;
    }
    return true;
  }

  zoomToFit(): boolean {
    setTimeout(() => this.dispatchInteraction({ type: 'endLayout' }), 300);
    const b = this.getBounds();
    const padding = this.options?.cameraOptions?.fitAllPadding ?? 10;
    const v = getFitToScreen(b, this.getLiveScreen(), padding, this.options);
    if (v) {
      this.dispatchPanScale({ type: 'destination', payload: v });
    }
    return true;
  }

  // ── Per-frame tick ────────────────────────────────────────────────────────

  tick(): void {
    if (this.keyAction) {
      this.dispatchPanScale({ type: 'keyAction', payload: this.keyAction });
    }
    if (this.panScale.destinationScale) {
      this.dispatchPanScale({ type: 'zoomPanimate' });
    }
    if (this.panScale.panPerFrame) {
      this.edgePan();
    }
  }

  private edgePan(): void {
    const { panPerFrame } = this.panScale;
    if (!panPerFrame) return;
    this.interaction.draggedNodes.forEach((n: RevisNodeDefinition) => {
      n.x = (n.x || 0) - panPerFrame.x;
      n.y = (n.y || 0) - panPerFrame.y;
    });
    this.dispatchPanScale({ type: 'edgePan' });
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  private runLayout(): boolean {
    this.dispatchInteraction({ type: 'runLayout' });
    if (
      this.lastLayouterResult &&
      typeof this.lastLayouterResult === 'object' &&
      'stop' in this.lastLayouterResult
    ) {
      this.lastLayouterResult.stop();
    }
    this.lastLayouterResult = this.layouter(
      { nodeMap: this.nodes, edgeMap: this.edges, shapes: this.shapes },
      this.options?.layoutOptions ?? {},
      this.getLiveScreen(),
      () => this.zoomToFit()
    );
    return true;
  }

  // ── Graph sync ────────────────────────────────────────────────────────────

  setGraph(graph: RevisGraph, shapes?: RevisShapeDefinition[]): void {
    this.syncGraph(graph, shapes);
  }

  private syncGraph(graph: RevisGraph, nextShapes?: RevisShapeDefinition[]): void {
    type VisualClassType = typeof RevisNode | typeof RevisEdge;

    const setGraphType = (
      gType: RevisNodeDefinition[] | RevisEdgeDefinition[],
      mType: Map<string, RevisNode> | Map<string, RevisEdge>,
      VisualClass: VisualClassType
    ): boolean => {
      let dirty = false;
      const dupMap: Record<string, number> = {};
      gType.forEach((n) => {
        const has = mType.has(n.id);
        const existing = mType.get(n.id) as RevisNode | RevisEdge | undefined;
        const diff = has && existing && existing.definition !== n;
        if (!has || diff) {
          if (VisualClass === RevisEdge) {
            const edgeDef = n as RevisEdgeDefinition;
            const to = edgeDef.to.toString();
            const from = edgeDef.from.toString();
            const toFrom = [to, from].sort().join('-');
            let dupNumber = 0;
            if (dupMap[toFrom] !== undefined) {
              dupNumber = dupMap[toFrom] + 1;
              dupMap[toFrom] = dupNumber;
            } else {
              dupMap[toFrom] = 0;
            }
            (mType as Map<string, RevisEdge>).set(
              n.id,
              new RevisEdge(
                n.id,
                edgeDef,
                this.nodes.get(to)!,
                this.nodes.get(from)!,
                dupNumber
              )
            );
          } else if (has && existing) {
            (existing as RevisNode).update(n as RevisNodeDefinition);
          } else {
            (mType as Map<string, RevisNode>).set(
              n.id,
              new RevisNode(n.id, n as RevisNodeDefinition, this.options)
            );
          }
          dirty = dirty || !has;
        }
      });

      mType.forEach((value, key) => {
        if (!gType.some((d) => d === value.definition)) {
          mType.delete(key);
          dirty = true;
        }
      });
      return dirty;
    };

    const currentGraph = {
      nodes: [...this.nodes.values()].map((n) => n.definition),
      edges: [...this.edges.values()].map((e) => e.definition),
    };

    const shouldRunLayouterResult = this.shouldRunLayouter
      ? this.shouldRunLayouter(
          { graph: currentGraph, shapes: this.shapes },
          { graph, shapes: nextShapes }
        )
      : false;

    const nodesDirty = setGraphType(graph.nodes, this.nodes, RevisNode);
    const edgesDirty = setGraphType(graph.edges, this.edges, RevisEdge);

    if (nextShapes !== undefined) {
      this.shapes = nextShapes;
    }

    if (nodesDirty || edgesDirty || shouldRunLayouterResult) {
      this.runLayout();
    }

    this.notify();
  }

  setOptions(options: RevisOptions): void {
    this.options = deepMerge({}, this.options, options);
    if (!deepEqual(options?.layoutOptions, this.lastLayoutOptions)) {
      this.lastLayoutOptions = options?.layoutOptions ?? {};
      this.runLayout();
    }
    this.notify();
  }

  setLayouter(layouter: RevisLayouter): void {
    this.layouter = layouter;
    this.runLayout();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  destroy(): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    if (
      this.lastLayouterResult &&
      typeof this.lastLayouterResult === 'object' &&
      'stop' in this.lastLayouterResult
    ) {
      this.lastLayouterResult.stop();
    }
    this.listeners.clear();
    this.canvas = null;
  }
}
