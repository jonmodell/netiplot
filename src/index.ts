import { RevisNetwork } from "./RevisNetwork";

export { RevisNetwork };

// Public types for consumers
export type {
  // Graph data
  RevisGraph,
  RevisNodeDefinition,
  RevisEdgeDefinition,
  RevisEdgeStyle,

  // Shapes
  RevisShapeDefinition,
  RevisShapeStyle,

  // Images
  RevisImageEntry,
  RevisImageMap,

  // Options
  RevisOptions,
  RevisNodeOptions,
  RevisEdgeOptions,
  RevisCameraOptions,
  RevisLayoutOptions,
  RevisHoverOptions,
  RevisInteractionOptions,

  // Drawing functions
  NodeDrawingFunction,
  ShapeDrawingFunction,

  // Callbacks and events
  RevisMouseEventType,
  RevisMouseHandler,
  RevisCallbackData,
  CustomControlsData,
  CustomControlsFn,

  // Layouter
  RevisLayouter,
  RevisLayouterResult,
  ShouldRunLayouter,

  // Component props
  RevisNetworkProps,

  // Camera state (useful for callbackFn consumers)
  PanScaleState,
} from "./types";
