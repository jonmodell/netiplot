import { NetiPlotNode, NetiPlotEdge } from './components';

// ─── Public Types (exported to consumers) ────────────────────────────────────

/**
 * A single image entry in the images map. Can be a raw image element
 * or an object with positioning/scaling options.
 */
export type NetiPlotImageDefinition =
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
export type NetiPlotImageMap = Record<string, NetiPlotImageDefinition>;

/**
 * The data structure for a NetiPlot Node definition. Additional properties can be
 * added to support custom node drawing functions.
 */
export interface NetiPlotNodeDefinition {
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

export interface NetiPlotEdgeStyle {
  color?: string;
  lineWidth?: number;
  font?: string;
  fontColor?: string;
}

/**
 * The data structure for a NetiPlot Edge definition.
 */
export interface NetiPlotEdgeDefinition {
  id: string;
  from: string;
  to: string;
  label?: string;
  size?: number;
  style?: NetiPlotEdgeStyle;
}

/**
 * The graph data passed to the `graph` prop.
 */
export interface NetiPlotGraph {
  nodes: NetiPlotNodeDefinition[];
  edges: NetiPlotEdgeDefinition[];
}

/**
 * The data structure for a NetiPlot Shape definition. Additional properties can be
 * added to support custom shape drawing functions.
 */
export interface NetiPlotShapeDefinition {
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

  style?: NetiPlotShapeStyle;

  // custom shape drawing function attributes
  [key: string]: any;
}

export interface NetiPlotShapeStyle {
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

export interface NetiPlotNodeOptions {
  showLabels?: boolean;
  defaultSize?: number;
  scaleCompensation?: false;
  nodeFillStyle?: string;
}

export interface NetiPlotEdgeOptions {
  showLabels?: boolean;
  arrowheads?: boolean;
  lineStyle?: string;
}

export interface NetiPlotCameraOptions {
  fitAllPadding?: {
    horizontal: number;
    vertical: number;
  };
}

export interface NetiPlotLayoutOptions {
  fitOnUpdate?: boolean;
  [key: string]: any;
}

export interface NetiPlotHoverOptions {
  width?: number;
  height?: number;
  edgeRenderer?: ((edge: NetiPlotEdgeDefinition) => React.ReactNode) | null;
  nodeRenderer?: ((node: NetiPlotNodeDefinition) => React.ReactNode) | null;
  delay?: number;
}

export interface NetiPlotInteractionOptions {
  allowGraphInteraction?: boolean;
  allowShapeInteraction?: boolean;
}

/**
 * All configuration options for the NetiPlotNetwork component.
 */
export interface NetiPlotOptions {
  nodes?: NetiPlotNodeOptions;
  edges?: NetiPlotEdgeOptions;
  cameraOptions?: NetiPlotCameraOptions;
  layoutOptions?: NetiPlotLayoutOptions;
  hover?: NetiPlotHoverOptions;
  interaction?: NetiPlotInteractionOptions;
  showMutedOverlay?: boolean;
}

// ─── Drawing Functions ───────────────────────────────────────────────────────

/**
 * Custom node drawing function. Receives a canvas 2D context and the node definition.
 */
export type NodeDrawingFunction = (ctx: CanvasRenderingContext2D, node: NetiPlotNodeDefinition) => void;

/**
 * Custom shape drawing function. Receives a canvas 2D context and the shape definition.
 */
export type ShapeDrawingFunction = (ctx: CanvasRenderingContext2D, shape: NetiPlotShapeDefinition) => void;

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
export type NetiPlotMouseEventType =
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
export type NetiPlotMouseHandler = (
  type: NetiPlotMouseEventType,
  items?: NetiPlotNodeDefinition | NetiPlotEdgeDefinition | NetiPlotShapeDefinition | NetiPlotNodeDefinition[] | NetiPlotShapeDefinition[] | null,
  event?: MouseEvent,
) => void;

/**
 * Data provided to the `callbackFn` prop, giving programmatic access to the network.
 */
export interface NetiPlotCallbackData {
  nodes: React.RefObject<Map<string, NetiPlotNode>>;
  getNodePositions: (nodes: Map<string, NetiPlotNode>) => Record<string, { x: number; y: number }>;
  getPositions: () => Record<string, { x: number; y: number }>;
  getCamera: () => PanScaleState;
  fit: () => boolean;
}

/**
 * Return type for layouter functions. Layouters may return void/boolean for synchronous layouts,
 * or an object with a `stop()` method for layouts that run asynchronously (e.g., force simulations).
 */
export type NetiPlotLayouterResult = void | boolean | { stop: () => void } | null;

/**
 * Layouter function signature. Receives graph data, options, screen info, and an optional
 * completion callback.
 */
export type NetiPlotLayouter = (
  data: { nodeMap: Map<string, NetiPlotNode>; edgeMap: Map<string, NetiPlotEdge>; shapes?: NetiPlotShapeDefinition[] },
  options: NetiPlotLayoutOptions,
  screen: NetiPlotScreen,
  onStopped?: () => void,
) => NetiPlotLayouterResult;

/**
 * Predicate to determine whether the layouter should re-run when graph data changes.
 */
export type ShouldRunLayouter = (
  prev: { graph: { nodes: NetiPlotNodeDefinition[]; edges: NetiPlotEdgeDefinition[] }; shapes?: NetiPlotShapeDefinition[] },
  next: { graph: NetiPlotGraph; shapes?: NetiPlotShapeDefinition[] },
) => boolean;

// ─── Component Props ─────────────────────────────────────────────────────────

/**
 * All props accepted by the `<NetiPlotNetwork>` component.
 */
export interface NetiPlotProps {
  /** Callback providing programmatic access to the network */
  callbackFn?: (data: NetiPlotCallbackData) => void;
  /** CSS class name for the container */
  className?: string;
  /** Custom zoom controls renderer. Pass `null` to hide controls entirely. */
  customControls?: ((data: CustomControlsData) => React.ReactNode) | null;
  /** Enable debug mode */
  debug?: boolean;
  /** The graph data (nodes and edges) */
  graph: NetiPlotGraph;
  /** A unique identifier for this network instance */
  identifier?: string;
  /** Map of image IDs to image entries for node icons */
  images?: NetiPlotImageMap;
  /** Layout algorithm function */
  layouter?: NetiPlotLayouter;
  /** Custom node drawing function for the canvas */
  nodeDrawingFunction?: NodeDrawingFunction;
  /** Mouse event callback */
  onMouse?: NetiPlotMouseHandler;
  /** Configuration options */
  options?: NetiPlotOptions;
  /** Custom shape drawing function for the canvas */
  shapeDrawingFunction?: ShapeDrawingFunction;
  /** Background shapes to render behind the graph */
  shapes?: NetiPlotShapeDefinition[];
  /** Predicate controlling when the layouter re-runs */
  shouldRunLayouter?: ShouldRunLayouter;
}

// ─── Internal Types (used within the library) ────────────────────────────────

export interface NetiPlotScreen {
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
  draggedNodes: NetiPlotNodeDefinition[];
  dragMouseMoved: boolean;
  mouseMoved?: boolean;
  shape: NetiPlotShapeDefinition | null;
  shapeHandle: string | null;
};

export type HoverState = {
  item: NetiPlotNodeDefinition | NetiPlotEdgeDefinition | null;
  itemType: string | null;
  popupPosition?: { x: number; y: number };
};

export type Handlers = (type: string, payload?: HTMLCanvasElement | null) => void;

export interface RendererProps {
  bounds: Bounds;
  className?: string;
  clearHover: () => void;
  customControls?: ((data: CustomControlsData) => React.ReactNode) | null;
  edges: Map<string, NetiPlotEdge>;
  handleKey: (event: KeyboardEvent) => boolean;
  handleMouse: (event: MouseEvent) => boolean;
  handleMouseWheel: (event: WheelEvent) => void;
  handleZoom: (event: { preventDefault: () => void }, level: string) => void;
  handlers?: Handlers;
  hoverState: HoverState;
  images: NetiPlotImageMap;
  interactionState: InteractionState;
  nodeDrawingFunction?: NodeDrawingFunction;
  nodes: Map<string, NetiPlotNode>;
  options: NetiPlotOptions;
  panScaleState: PanScaleState;
  rolloverState: NetiPlotNode | NetiPlotEdge | null;
  screen: NetiPlotScreen;
  shapeDrawingFunction?: ShapeDrawingFunction;
  shapes: NetiPlotShapeDefinition[];
  uid: React.RefObject<string>;
}

// Backwards compatibility alias
export type NetiPlotBaseProps = NetiPlotProps;
