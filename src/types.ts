import { RevisNode, RevisEdge} from './components';

export type CustomControlsFn = (
  event: React.MouseEvent<HTMLButtonElement, MouseEvent>
) => void;

export interface CustomControlsData {
  zoomIn: CustomControlsFn;
  zoomOut: CustomControlsFn;
  fitAll: CustomControlsFn;
  fitSelection: CustomControlsFn;
}

export interface LayouterData {
  layout: (
    nodes: Array<RevisNode>,
    edges: Array<RevisEdge>,
    options: Object
  ) => Array<RevisNode>;
  options: Object;
}

export interface RevisScreen {
  width: number | undefined;
  height: number | undefined;
  ratio: number;
  boundingRect: DOMRect | undefined | null;
}

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
  }
}

export interface RevisLayoutOptions {
  fitOnUpdate?: boolean;
  [key: string]: any;
}

export interface RevisHoverOptions {
  width?: number;
  height?: number;
  edgeRenderer?: ((edge: RevisEdge) => void) | null;
  nodeRenderer?: ((node: RevisNode) => void) | null;
  delay?: number;
}

export interface RevisInteractionOptions {
  allowGraphInteraction?: boolean;
  allowShapeInteraction?: boolean;
}

export interface RevisOptions {
  nodes?: RevisNodeOptions;
  edges?: RevisEdgeOptions;
  cameraOptions?: RevisCameraOptions;
  layoutOptions?: RevisLayoutOptions;
  hover?: RevisHoverOptions;
  interaction?: RevisInteractionOptions;
  showMutedOverlay?: boolean;
}

/**
* @description The data structure for a Revis Shape definition. Additional properties can be
* added to support custom shape drawing functions.
*/
export interface RevisShapeDefinition {
  // various ways to support images as shapes
  image?: HTMLImageElement | SVGImageElement | HTMLCanvasElement;
  imageId?: string;
  mapImageId?: string;
  
  // custom shape drawing functions "shape" variable to be used to switch between different shapes
  // dreawing routines
  shape: string;

  // size and position and visibility
  scale?: number;
  height: number;
  width: number;
  x: number;
  y: number;
  visible?: boolean;
  
  style?: {
    lineWidth?: number;
    // all of these set the stroke color
    border?: string | CanvasGradient | CanvasPattern;
    strokeColor?: string | CanvasGradient | CanvasPattern;
    stroke?: string | CanvasGradient | CanvasPattern;
    line?: string | CanvasGradient | CanvasPattern;

    // all of these set the fill color
    background?: string;
    fillColor?: string;
    fill?: string;
  }

  // custom shape drawing functions attributes you choose to add and support
  [key: string]: any;
}

/**
 * @description The data structure for a Revis Node definition. Additional properties can be
 * added to support custom node drawing functions.
 */
export interface RevisNodeDefinition {
  fixed?: boolean;
  id: string;
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
 * @description The data structure for a Revis Edge definition.  Since there is no custom 
 * EdgeDrawingFunction, the edge definition is a simple object.
 */
export interface RevisEdgeDefinition {
  id: string;
  from: string;
  to: string;
  label?: string;
  size?: number;
  style?: RevisEdgeStyle;
}

export interface RevisGraph {
  nodes: RevisNodeDefinition[];
  edges: RevisEdgeDefinition[];
}

export interface RevisNetworkBaseProps {
  callbackFn?: Function;
  className?: string;
  customControls?: (data: CustomControlsData) => React.ReactNode;
  debug?: boolean;
  graph: RevisGraph;
  identifier?: string;
  images?: Object;
  layouter?: (data: LayouterData, options: any, screen: any) => void;
  nodeDrawingFunction?: (context: any, definition: any, size: number) => void;
  onMouse?: (type: string, items?: any, event?: any, network?: any) => void;
  options?: RevisOptions;
  shapeDrawingFunction?: (context: any, definition: any, size: number) => void;
  shapes?: RevisShapeDefinition[];
  shouldRunLayouter?: (prev: any, next: any) => boolean;
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
}

export type PanScaleState = {
  destinationPan: {
    x: number;
    y: number;
  };
  destinationScale: number;
  pan: {
    x: number;
    y: number;
  };
  scale: number;
};

export type InteractionState = {
  action: string;
  actionItem: string;
  actionItemType: string;
  actionItemBounds: Bounds;
  actionItemPosition: {
    x: number;
    y: number;
  };
  actionItemScale: number;
  actionItemRotation: number;
  actionItemRotationOffset: number;
  actionItemRotationOffsetX: number;
  actionItemRotationOffsetY: number;
  actionItemRotationOffsetZ: number;
  actionItemRotationX: number;
  actionItemRotationY: number;
  actionItemRotationZ: number;
  actionItemLabel: string;
  actionItemLabelStyle: Object;
  actionItemLabelPosition: string;
};

export type RolloverState = {
  id: string;
  type: string;
  bounds: Bounds;
  position: {
    x: number;
    y: number;
  };
  scale: number;
  rotation: number;
  rotationOffset: number;
  rotationOffsetX: number;
  rotationOffsetY: number;
  rotationOffsetZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  label: string;
  labelStyle: Object;
  labelPosition: string;
};

export type EditItem = {
  id: string;
  type: string;
  bounds: any;
  position: {
    x: number;
    y: number;
  };
  scale: number;
  rotation: number;
  rotationOffset: number;
  rotationOffsetX: number;
  rotationOffsetY: number;
  rotationOffsetZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  label: string;
  labelStyle: Object;
  labelPosition: string;
};

export type NodeDrawingFunction = (node: RevisNode, ctx: CanvasRenderingContext2D) => void;
export type ShapeDrawingFunction = (
  shape: RevisShapeDefinition,
  ctx: CanvasRenderingContext2D
) => void;

export type Handlers = (type: string, payload?: unknown) => void;

export interface RendererOptions{
  showMutedOverlay: boolean;
  editMode: boolean;
}

export interface RendererProps {
  className?: string;
  customControls?: ((data: CustomControlsData) => React.ReactNode) | null;
  nodes: Map<string, RevisNode>;
  edges: Map<string, RevisEdge>;
  shapes: RevisShapeDefinition[];
  bounds: Bounds;
  panScaleState: PanScaleState;
  interactionState: InteractionState;
  rolloverState: RolloverState;
  editItem?: EditItem;
  nodeDrawingFunction?: NodeDrawingFunction;
  shapeDrawingFunction?: ShapeDrawingFunction;
  handlers?: Handlers;
  screen: {
    width: number;
    height: number;
  };
  images: Map<string, unknown>;
  options: RendererOptions;
}
