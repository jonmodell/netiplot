import { RevisNode, RevisEdge } from './components';

// ─── Public Types (exported to consumers) ────────────────────────────────────

/**
 * A single image entry in the images map. Can be a raw image element
 * or an object with positioning/scaling options.
 */
export type RevisImageEntry =
  | HTMLImageElement
  | SVGImageElement
  | HTMLCanvasElement
  | {
      element: HTMLImageElement | HTMLCanvasElement;
      scale?: number;
      offsetX?: number;
      offsetY?: number;
    };

/**
 * Map of image IDs to image entries, passed to the `images` prop.
 */
export type RevisImageMap = Record<string, RevisImageEntry>;

/**
 * The data structure for a Revis Node definition. Additional properties can be
 * added to support custom node drawing functions.
 */
export interface RevisNodeDefinition {
  id: string;
  fixed?: boolean;
  image?: string;
  innerLabel?: string;
  label?: string;
  shape?: string;
  size?: number;
  type?: string;
  x?: number;
  y?: number;
  style?: {
    border?: string;
    size?: number;
    background?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface RevisEdgeStyle {
  color?: string;
  lineWidth?: number;
  font?: string;
  fontColor?: string;
}

/**
 * The data structure for a Revis Edge definition.
 */
export interface RevisEdgeDefinition {
  id: string;
  from: string;
  to: string;
  label?: string;
  size?: number;
  style?: RevisEdgeStyle;
}

/**
 * The graph data passed to the `graph` prop.
 */
export interface RevisGraph {
  nodes: RevisNodeDefinition[];
  edges: RevisEdgeDefinition[];
}

/**
 * The data structure for a Revis Shape definition. Additional properties can be
 * added to support custom shape drawing functions.
 */
export interface RevisShapeDefinition {
  id?: string;
  shape: string;

  // size and position — use width/height, or size for square shapes
  height?: number;
  width?: number;
  x: number;
  y: number;
  size?: number;

  // visibility and editing
  visible?: boolean;
  noEdit?: boolean;
  noClick?: boolean;
  boundsIgnore?: boolean;

  // image support
  image?: HTMLImageElement | SVGImageElement | HTMLCanvasElement;
  imageId?: string;
  mapImageId?: string;
  scale?: number;

  style?: RevisShapeStyle;

  // custom shape drawing function attributes
  [key: string]: any;
}

export interface RevisShapeStyle {
  lineWidth?: number;
  border?: string | CanvasGradient | CanvasPattern;
  strokeColor?: string | CanvasGradient | CanvasPattern;
  stroke?: string | CanvasGradient | CanvasPattern;
  line?: string | CanvasGradient | CanvasPattern;
  background?: string;
  fillColor?: string;
  fill?: string;
}

// ─── Options ─────────────────────────────────────────────────────────────────

export interface RevisNodeOptions {
  showLabels?: boolean;
  defaultSize?: number;
  scaleCompensation?: false;
  nodeFillStyle?: string;
}

export interface RevisEdgeOptions {
  showLabels?: boolean;
  arrowheads?: boolean;
  lineStyle?: string;
}

export interface RevisCameraOptions {
  fitAllPadding?: {
    horizontal: number;
    vertical: number;
  };
}

export interface RevisLayoutOptions {
  fitOnUpdate?: boolean;
  [key: string]: any;
}

export interface RevisHoverOptions {
  width?: number;
  height?: number;
  edgeRenderer?: ((edge: RevisEdgeDefinition) => React.ReactNode) | null;
  nodeRenderer?: ((node: RevisNodeDefinition) => React.ReactNode) | null;
  delay?: number;
}

export interface RevisInteractionOptions {
  allowGraphInteraction?: boolean;
  allowShapeInteraction?: boolean;
}

/**
 * All configuration options for the RevisNetwork component.
 */
export interface RevisOptions {
  nodes?: RevisNodeOptions;
  edges?: RevisEdgeOptions;
  cameraOptions?: RevisCameraOptions;
  layoutOptions?: RevisLayoutOptions;
  hover?: RevisHoverOptions;
  interaction?: RevisInteractionOptions;
  showMutedOverlay?: boolean;
}

// ─── Drawing Functions ───────────────────────────────────────────────────────

/**
 * Custom node drawing function. Receives a canvas 2D context and the node definition.
 */
export type NodeDrawingFunction = (ctx: CanvasRenderingContext2D, node: RevisNodeDefinition) => void;

/**
 * Custom shape drawing function. Receives a canvas 2D context and the shape definition.
 */
export type ShapeDrawingFunction = (ctx: CanvasRenderingContext2D, shape: RevisShapeDefinition) => void;

// ─── Callbacks ───────────────────────────────────────────────────────────────

export type CustomControlsFn = (
  event: React.MouseEvent<HTMLButtonElement, MouseEvent>
) => void;

export interface CustomControlsData {
  zoomIn: CustomControlsFn;
  zoomOut: CustomControlsFn;
  fitAll: CustomControlsFn;
  fitSelection: CustomControlsFn;
}

/**
 * Mouse event types emitted by the `onMouse` callback.
 */
export type RevisMouseEventType =
  | 'nodeClick'
  | 'nodeDblClick'
  | 'nodesDragged'
  | 'edgeClick'
  | 'edgeDblClick'
  | 'shapeClick'
  | 'shapeDblClick'
  | 'shapeUpdate'
  | 'backgroundClick';

/**
 * The `onMouse` callback signature.
 */
export type RevisMouseHandler = (
  type: RevisMouseEventType,
  items?: RevisNodeDefinition | RevisEdgeDefinition | RevisShapeDefinition | RevisNodeDefinition[] | RevisShapeDefinition[] | null,
  event?: MouseEvent,
) => void;

/**
 * Data provided to the `callbackFn` prop, giving programmatic access to the network.
 */
export interface RevisCallbackData {
  nodes: React.RefObject<Map<string, RevisNode>>;
  getNodePositions: (nodes: Map<string, RevisNode>) => Record<string, { x: number; y: number }>;
  getPositions: () => Record<string, { x: number; y: number }>;
  getCamera: () => PanScaleState;
  fit: () => boolean;
}

/**
 * Return type for layouter functions. Layouters may return void/boolean for synchronous layouts,
 * or an object with a `stop()` method for layouts that run asynchronously (e.g., force simulations).
 */
export type RevisLayouterResult = void | boolean | { stop: () => void } | null;

/**
 * Layouter function signature. Receives graph data, options, screen info, and an optional
 * completion callback.
 */
export type RevisLayouter = (
  data: { nodeMap: Map<string, RevisNode>; edgeMap: Map<string, RevisEdge>; shapes?: RevisShapeDefinition[] },
  options: RevisLayoutOptions,
  screen: RevisScreen,
  onStopped?: () => void,
) => RevisLayouterResult;

/**
 * Predicate to determine whether the layouter should re-run when graph data changes.
 */
export type ShouldRunLayouter = (
  prev: { graph: { nodes: RevisNodeDefinition[]; edges: RevisEdgeDefinition[] }; shapes?: RevisShapeDefinition[] },
  next: { graph: RevisGraph; shapes?: RevisShapeDefinition[] },
) => boolean;

// ─── Component Props ─────────────────────────────────────────────────────────

/**
 * All props accepted by the `<RevisNetwork>` component.
 */
export interface RevisNetworkProps {
  /** Callback providing programmatic access to the network */
  callbackFn?: (data: RevisCallbackData) => void;
  /** CSS class name for the container */
  className?: string;
  /** Custom zoom controls renderer. Pass `null` to hide controls entirely. */
  customControls?: ((data: CustomControlsData) => React.ReactNode) | null;
  /** Enable debug mode */
  debug?: boolean;
  /** The graph data (nodes and edges) */
  graph: RevisGraph;
  /** A unique identifier for this network instance */
  identifier?: string;
  /** Map of image IDs to image entries for node icons */
  images?: RevisImageMap;
  /** Layout algorithm function */
  layouter?: RevisLayouter;
  /** Custom node drawing function for the canvas */
  nodeDrawingFunction?: NodeDrawingFunction;
  /** Mouse event callback */
  onMouse?: RevisMouseHandler;
  /** Configuration options */
  options?: RevisOptions;
  /** Custom shape drawing function for the canvas */
  shapeDrawingFunction?: ShapeDrawingFunction;
  /** Background shapes to render behind the graph */
  shapes?: RevisShapeDefinition[];
  /** Predicate controlling when the layouter re-runs */
  shouldRunLayouter?: ShouldRunLayouter;
}

// ─── Internal Types (used within the library) ────────────────────────────────

export interface RevisScreen {
  width: number | undefined;
  height: number | undefined;
  ratio: number;
  boundingRect: DOMRect | undefined | null;
}

export interface DrawingBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width?: number;
  height?: number;
}

export type PanScaleState = {
  destinationPan: { x: number; y: number } | null;
  destinationScale: number | null;
  pan: { x: number; y: number };
  panPerFrame: { x: number; y: number } | null;
  scale: number;
};

export type InteractionState = {
  action: string | null;
  draggedNodes: RevisNodeDefinition[];
  dragMouseMoved: boolean;
  mouseMoved?: boolean;
  shape: RevisShapeDefinition | null;
  shapeHandle: string | null;
};

export type HoverState = {
  item: RevisNodeDefinition | RevisEdgeDefinition | null;
  itemType: string | null;
  popupPosition?: { x: number; y: number };
};

export type Handlers = (type: string, payload?: HTMLCanvasElement | null) => void;

export interface RendererProps {
  bounds: Bounds;
  className?: string;
  clearHover: () => void;
  customControls?: ((data: CustomControlsData) => React.ReactNode) | null;
  edges: Map<string, RevisEdge>;
  handleKey: (event: KeyboardEvent) => boolean;
  handleMouse: (event: MouseEvent) => boolean;
  handleMouseWheel: (event: WheelEvent) => void;
  handleZoom: (event: { preventDefault: () => void }, level: string) => void;
  handlers?: Handlers;
  hoverState: HoverState;
  images: RevisImageMap;
  interactionState: InteractionState;
  nodeDrawingFunction?: NodeDrawingFunction;
  nodes: Map<string, RevisNode>;
  options: RevisOptions;
  panScaleState: PanScaleState;
  rolloverState: RevisNode | RevisEdge | null;
  screen: RevisScreen;
  shapeDrawingFunction?: ShapeDrawingFunction;
  shapes: RevisShapeDefinition[];
  uid: React.RefObject<string>;
}

// Backwards compatibility alias
export type RevisNetworkBaseProps = RevisNetworkProps;
