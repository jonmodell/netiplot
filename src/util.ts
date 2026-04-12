import { RevisNode, RevisEdge } from "./components";
import { Bounds, PanScaleState, RevisEdgeOptions, RevisNodeDefinition, RevisOptions, RevisScreen, RevisShapeDefinition } from "./types";

const SCREEN_PAN_MARGIN = 35;
const ZOOM_FACTOR = 0.002;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 6;

// if we are dragging off screen, pan with the edges of the screen
// the screenSettings.screenPan setting changes the pan by that amount during the ReVisNetwork.draw function
export function getScreenEdgePan(sc: RevisScreen, e: { clientX: number; clientY: number }) {
  const br = sc.boundingRect;
  if (!br) return null;
  const d = SCREEN_PAN_MARGIN;
  const screenPan = { x: 0, y: 0 };
  if (e.clientX < d + br.left) {
    screenPan.x = d + br.left - e.clientX;
  } else if (e.clientX > br.width + br.left - d) {
    screenPan.x = -(d - (br.width + br.left - e.clientX));
  }

  if (e.clientY < d + br.top) {
    screenPan.y = d + br.top - e.clientY;
  } else if (e.clientY > br.height + br.top - d) {
    screenPan.y = -(d - (br.height + br.top - e.clientY));
  }
  return screenPan.x || screenPan.y ? screenPan : null;
}

// translate a node position into DOM coordinates relative to the canvas
export function getNodeScreenPos(n: { x: number; y: number }, tracking: PanScaleState) {
  const { pan, scale } = tracking;
  const x = n.x * scale + pan.x;
  const y = n.y * scale + pan.y;
  return { x, y };
}

// figure out if a hover window should go left, right, above or below based on screen position
export function getHoverPos(pos: { x: number; y: number }, screen: RevisScreen, panScaleState: PanScaleState, opts: RevisOptions) {
  const nodeSize = opts.nodes?.defaultSize || 30;
  const { width, height } = screen.boundingRect || { width: 0, height: 0 };
  const { scale } = panScaleState;
  const nodeOffset = (nodeSize * scale) / 2;
  const hoverWidth = opts.hover?.width || 200;
  const hoverHeight = opts.hover?.height || 150;
  const x = pos.x > width * 0.5 ? pos.x - hoverWidth : pos.x;
  const y =
    pos.y > height * 0.5
      ? pos.y - hoverHeight - nodeOffset
      : pos.y + nodeOffset;
  return { x, y };
}

// detect node and mouse collisions for nodeClicking
export function checkNodeAtPosition(node: { bSize: number; x: number; y: number; }, position: { x: number; y: number; }) {
  const offset = node.bSize / 2;
  return (
    position.x > node.x - offset &&
    position.x < node.x + offset &&
    position.y > node.y - offset &&
    position.y < node.y + offset
  );
}

// looks through the dataset and returns a node at a given mouse position if there is one
export function getNodeAtPosition(nodes: Map<string, RevisNode>, pos: { x: number; y: number }) {
  for (const node of nodes.values()) {
    if (checkNodeAtPosition(node, pos)) {
      return node;
    }
  }
  return null;
}

// looks through the dataset and returns an edge at a given mouse position if there is one
export function getEdgeAtPosition(edges: Map<string, RevisEdge>, pos: { x: number; y: number }, edgeOptions: RevisEdgeOptions | undefined) {
  for (const edge of edges.values()) {
    const dist = edge.getDistanceFrom(pos, edgeOptions || {});
    if (dist !== null && dist < 10) {
      return edge;
    }
  }
  return null;
}

export const getBounds = (nds: RevisNode[] = [], shps: RevisShapeDefinition[] = []): Bounds => {
  const combined: Array<{ x: number; y: number; width?: number; height?: number; size?: number; destination?: { x: number; y: number } | null }> = [
    ...nds,
    ...shps.filter((s) => s && s.boundsIgnore === undefined),
  ];
  const first = combined[0];
  if (!first) {
    return { maxX: 100, minX: 0, maxY: 100, minY: 0, width: 100, height: 100 };
  }
  const bds: Bounds = {
    maxX: first.x, minX: first.x, maxY: first.y, minY: first.y, width: 0, height: 0,
  };
  combined.forEach((n) => {
    const newX = n.destination?.x || n.x || 0;
    const newY = n.destination?.y || n.y || 0;
    bds.maxX = Math.max(bds.maxX, newX + (n.width || n.size || 30));
    bds.maxY = Math.max(bds.maxY, newY + (n.height || n.size || 30));
    bds.minX = Math.min(bds.minX, newX - 30);
    bds.minY = Math.min(bds.minY, newY - 30);
    bds.width = bds.maxX - bds.minX;
    bds.height = bds.maxY - bds.minY;
  });
  return bds;
};

export const getBoundsScale = (height: number | undefined, width: number | undefined, bounds: Bounds, opts: RevisOptions) => {
  const nodeSize = opts.nodes?.defaultSize || 30;
  const hf = (height as number) / ((bounds.height || 0) + nodeSize * 2);
  const wf = (width as number) / ((bounds.width || 0) + nodeSize * 2);
  return Math.min(hf, wf);
};

export function getPanScaleFromMouseWheel(
  e: MouseEvent | WheelEvent,
  panScaleState: PanScaleState,
  screen: RevisScreen,
  bounds: Bounds,
  opts: RevisOptions,
) {
  const { scale, pan } = panScaleState;
  const { height, width, boundingRect } = screen;
  const boundScale = getBoundsScale(height, width, bounds, opts);
  const realMinZoom = Math.min(MIN_ZOOM, boundScale) * 0.95;
  const deltaY = 'deltaY' in e ? e.deltaY : 0;
  const newScale = Math.min(
    Math.max(realMinZoom, scale - ZOOM_FACTOR * deltaY),
    MAX_ZOOM,
  );

  const mouseX = e.clientX - (boundingRect?.left || 0);
  const mouseY = e.clientY - (boundingRect?.top || 0);

  const pm = { x: mouseX - pan.x, y: mouseY - pan.y };
  const diffPt = {
    x: (pm.x * newScale - pm.x * scale) / scale,
    y: (pm.y * newScale - pm.y * scale) / scale,
  };

  const newPan = {
    x: pan.x - diffPt.x,
    y: pan.y - diffPt.y,
  };

  return { ...panScaleState, scale: newScale, pan: newPan };
}

export function getFitToScreen(bounds: Bounds, screen: RevisScreen, padding: number | { horizontal: number; vertical: number }, opts: RevisOptions) {
  if (!bounds) {
    return null;
  }
  const nodeSize = opts.nodes?.defaultSize || 30;
  const horizontal = typeof padding === 'number' ? padding : padding.horizontal;
  const vertical = typeof padding === 'number' ? padding : padding.vertical;
  const hf = ((screen.height as number) - vertical) / ((bounds.height || 0) + nodeSize * 2);
  const wf = ((screen.width as number) - horizontal) / ((bounds.width || 0) + nodeSize * 2);
  const scale = Number(Math.min(hf, wf).toFixed(4));
  const x = (screen.width as number) / 2 - ((bounds.width || 0) / 2 + bounds.minX) * scale;
  const y = (screen.height as number) / 2 - ((bounds.height || 0) / 2 + bounds.minY) * scale;
  const pan = { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  return { scale, pan };
}

export const getMousePos = (e: MouseEvent, screen: RevisScreen, panZoomState: PanScaleState) => {
  const { boundingRect } = screen;
  const { scale, pan } = panZoomState;
  if (!boundingRect) {
    return { x: -1000, y: -1000 };
  }
  return {
    x: (e.clientX - boundingRect.left - pan.x) / scale,
    y: (e.clientY - boundingRect.top - pan.y) / scale,
  };
};

export const getNodePositions = (nodes: Map<string, RevisNode>) => {
  const ret: Record<string, { x: number; y: number }> = {};
  for (const node of nodes.values()) {
    ret[node.id] = { x: node.x, y: node.y };
  }
  return ret;
};

const keyMap: Record<string, string> = {
  ArrowUp: '_moveUp',
  ArrowDown: '_moveDown',
  ArrowLeft: '_moveLeft',
  ArrowRight: '_moveRight',
  '[': '_zoomOut',
  ']': '_zoomIn',
  pageup: '_zoomIn',
  pagedown: '_zoomOut',
  '1': '_1',
  '2': '_2',
  '3': '_3',
  '5': '_0.5',
};

export const getKeyAction = (key: string | number) => keyMap[key] || null;


const checkShapeClick = (n: { noClick?: boolean; x?: number; y?: number; size?: number; width?: number; height?: number }, pos: { x: number; y: number }) => {
  if (
    n.noClick ||
    n.x === undefined ||
    n.y === undefined ||
    (n.size === undefined && n.width === undefined && n.height === undefined)
  ) {
    return false;
  }
  const bounds = {
    minX: n.x!,
    maxX: n.x! + (n.width || n.size || 0),
    minY: n.y!,
    maxY: n.y! + (n.height || n.size || 0),
  };
  return (
    pos.x > bounds.minX &&
    pos.x < bounds.maxX &&
    pos.y > bounds.minY &&
    pos.y < bounds.maxY
  );
};

type ShapeLike = { noClick?: boolean; x?: number; y?: number; size?: number; width?: number; height?: number; [key: string]: unknown };

export function getShapeAtPos<T extends ShapeLike>(shapes: T[] | undefined, pos: { x: number; y: number }): T | false {
  if (!shapes) return false;
  for (let i = shapes.length - 1; i >= 0; i--) {
    const n = shapes[i];
    const clicked = checkShapeClick(n, pos);
    if (clicked) {
      return n;
    }
  }
  return false;
}

export function inViewPort(item: { x: number; y: number }, viewPort: { left: number; top: number; right: number; bottom: number }) {
  return (
    viewPort &&
    item.x < viewPort.right &&
    item.x > viewPort.left &&
    item.y > viewPort.top &&
    item.y < viewPort.bottom
  );
}

const HANDLE_OFFSET = 8;
const MIN_SHAPE_SIZE = 10;

export function getHandleAtPos(item: RevisShapeDefinition, pos: { x: number; y: number }, scale: number) {
  const itemWidth = item.width || item.size || 0;
  const itemHeight = item.height || item.size || 0;
  const handleSize = HANDLE_OFFSET / scale;
  const offset = handleSize * 0.5;

  const c = item.x + itemWidth / 2 - offset;
  const m = item.y + itemHeight / 2 - offset;
  const l = item.x - handleSize * 2 + offset;
  const r = item.x + itemWidth + offset;
  const t = item.y - handleSize - offset;
  const b = item.y + itemHeight + offset;
  const handles = [
    { id: 'tl', x: l, y: t, size: handleSize },
    { id: 'tc', x: c, y: t, size: handleSize },
    { id: 'tr', x: r, y: t, size: handleSize },
    { id: 'bl', x: l, y: b, size: handleSize },
    { id: 'bc', x: c, y: b, size: handleSize },
    { id: 'br', x: r, y: b, size: handleSize },
    { id: 'ml', x: l, y: m, size: handleSize },
    { id: 'mr', x: r, y: m, size: handleSize },
  ];
  const handle = getShapeAtPos(handles, pos);
  return handle ? handle.id : undefined;
}

export function setShapeByHandleDrag(si: RevisShapeDefinition, handle: string, delta: { x: number; y: number }, ctrl: boolean) {
  const ret: { x: number; y: number; width: number; height: number } = {
    x: si.x,
    y: si.y,
    width: si.width || si.size || 0,
    height: si.height || si.size || 0,
  };
  if (si && handle) {
    switch (handle) {
      case 'tl':
        ret.width = (si.width || si.size || 0) - delta.x;
        ret.x += delta.x;
        ret.height = (si.height || si.size || 0) - delta.y;
        ret.y += delta.y;
        break;
      case 'bl':
        ret.width = (si.width || si.size || 0) - delta.x;
        ret.x += delta.x;
        ret.height = (si.height || si.size || 0) + delta.y;
        break;
      case 'ml':
        ret.width = (si.width || si.size || 0) - delta.x;
        ret.x += delta.x;
        break;
      case 'tr':
        ret.width = (si.width || si.size || 0) + delta.x;
        ret.height = (si.height || si.size || 0) - delta.y;
        ret.y += delta.y;
        break;
      case 'br':
        ret.width = (si.width || si.size || 0) + delta.x;
        ret.height = (si.height || si.size || 0) + delta.y;
        break;
      case 'mr':
        ret.width = (si.width || si.size || 0) + delta.x;
        break;
      case 'bc':
        ret.height = (si.height || si.size || 0) + delta.y;
        break;
      case 'tc':
        ret.height = (si.height || si.size || 0) - delta.y;
        ret.y += delta.y;
        break;
      default:
        break;
    }
  }
  ret.width = Math.max(ret.width, MIN_SHAPE_SIZE);
  ret.height = Math.max(ret.height, MIN_SHAPE_SIZE);
  if (ctrl) {
    const smaller = Math.min(ret.width, ret.height);
    ret.height = smaller;
    ret.width = smaller;
  }
  return ret;
}

function isObject(val: unknown): val is Record<string, any> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function deepMerge(...sources: any[]): any {
  const target: any = {};
  for (const source of sources) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      if (isObject(source[key]) && isObject(target[key])) {
        target[key] = deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (isObject(a)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}
