import { RenderLoop, drawShapes, drawObjects } from './RenderLoop';
import type { RenderState, RenderLoopCanvases } from './RenderLoop';
import { initialPanScaleState } from './panScaleState';
import { initialInteraction } from './interactionState';

// ── RAF mock ──────────────────────────────────────────────────────────────────

type FrameEntry = { id: number; cb: FrameRequestCallback };
let pendingFrames: FrameEntry[] = [];
let cancelledIds = new Set<number>();
let rafIdCounter = 0;

const mockRaf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
  const id = ++rafIdCounter;
  pendingFrames.push({ id, cb });
  return id;
});
const mockCaf = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
  cancelledIds.add(id);
});

/** Run all pending (non-cancelled) RAF callbacks with a given timestamp. */
function flushFrames(timestamp = 100): void {
  const frames = [...pendingFrames];
  pendingFrames = [];
  frames.forEach(({ id, cb }) => {
    if (!cancelledIds.has(id)) cb(timestamp);
  });
}

beforeEach(() => {
  pendingFrames = [];
  cancelledIds = new Set();
  rafIdCounter = 0;
  mockRaf.mockClear();
  mockCaf.mockClear();
});

// ── Canvas mock ───────────────────────────────────────────────────────────────

function makeCtx(): CanvasRenderingContext2D {
  return {
    save: jest.fn(),
    restore: jest.fn(),
    clearRect: jest.fn(),
    transform: jest.fn(),
    translate: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillRect: jest.fn(),
    drawImage: jest.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function makeCanvas(): HTMLCanvasElement {
  const ctx = makeCtx();
  const canvas = document.createElement('canvas');
  jest.spyOn(canvas, 'getContext').mockReturnValue(ctx);
  return canvas;
}

function makeCanvases(): RenderLoopCanvases {
  return { shapes: makeCanvas(), edges: makeCanvas(), nodes: makeCanvas() };
}

// ── Minimal RenderState ───────────────────────────────────────────────────────

function makeState(overrides: Partial<RenderState> = {}): RenderState {
  return {
    panScale: { ...initialPanScaleState },
    interaction: { ...initialInteraction },
    nodes: new Map(),
    edges: new Map(),
    shapes: [],
    screen: { width: 800, height: 600, ratio: 1, boundingRect: null },
    options: {},
    rollover: null,
    images: {},
    ...overrides,
  };
}

// ── RenderLoop ────────────────────────────────────────────────────────────────

describe('RenderLoop construction', () => {
  it('schedules first RAF on construction', () => {
    new RenderLoop(makeCanvases(), () => makeState(), jest.fn());
    expect(mockRaf).toHaveBeenCalledTimes(1);
  });

  it('draws on first frame (starts dirty)', () => {
    const canvases = makeCanvases();
    new RenderLoop(canvases, () => makeState(), jest.fn());
    flushFrames(100);
    // clearRect called = draw happened
    expect(canvases.shapes.getContext('2d')!.clearRect).toHaveBeenCalled();
  });
});

describe('onTick', () => {
  it('calls onTick every frame that passes the throttle', () => {
    const onTick = jest.fn();
    new RenderLoop(makeCanvases(), () => makeState(), onTick);

    // First frame — lastFrameTime is 0, so tick fires
    flushFrames(100);
    expect(onTick).toHaveBeenCalledTimes(1);

    // Second frame with enough delta (>30ms)
    flushFrames(140);
    expect(onTick).toHaveBeenCalledTimes(2);
  });

  it('skips tick when frame delta is below throttle', () => {
    const onTick = jest.fn();
    new RenderLoop(makeCanvases(), () => makeState(), onTick);

    flushFrames(100);   // first frame, sets lastFrameTime = 100
    onTick.mockClear();
    flushFrames(110);   // delta = 10ms < 30ms → skip
    expect(onTick).not.toHaveBeenCalled();
  });
});

describe('dirty flag', () => {
  it('draws when dirty', () => {
    const canvases = makeCanvases();
    const loop = new RenderLoop(canvases, () => makeState(), jest.fn());

    flushFrames(100);  // clears initial dirty
    const ctx = canvases.shapes.getContext('2d')!;
    (ctx.clearRect as jest.Mock).mockClear();

    loop.markDirty();
    flushFrames(140);
    expect(ctx.clearRect).toHaveBeenCalled();
  });

  it('skips draw when not dirty and no animation', () => {
    const canvases = makeCanvases();
    new RenderLoop(canvases, () => makeState(), jest.fn());

    flushFrames(100);  // clears initial dirty
    const ctx = canvases.shapes.getContext('2d')!;
    (ctx.clearRect as jest.Mock).mockClear();

    flushFrames(140);  // not dirty, no animation
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });

  it('draws when interaction.action is set even if not dirty', () => {
    const canvases = makeCanvases();
    const state = makeState({ interaction: { ...initialInteraction, action: 'drag' } });
    new RenderLoop(canvases, () => state, jest.fn());

    flushFrames(100);  // clears initial dirty
    const ctx = canvases.shapes.getContext('2d')!;
    (ctx.clearRect as jest.Mock).mockClear();

    flushFrames(140);  // not dirty, but action is set
    expect(ctx.clearRect).toHaveBeenCalled();
  });

  it('draws when destinationScale is set even if not dirty', () => {
    const canvases = makeCanvases();
    const state = makeState({
      panScale: { ...initialPanScaleState, destinationScale: 2 },
    });
    new RenderLoop(canvases, () => state, jest.fn());

    flushFrames(100);
    const ctx = canvases.shapes.getContext('2d')!;
    (ctx.clearRect as jest.Mock).mockClear();

    flushFrames(140);
    expect(ctx.clearRect).toHaveBeenCalled();
  });
});

describe('stop', () => {
  it('cancels the RAF', () => {
    const loop = new RenderLoop(makeCanvases(), () => makeState(), jest.fn());
    loop.stop();
    expect(mockCaf).toHaveBeenCalled();
  });

  it('does not schedule new frames after stop', () => {
    const loop = new RenderLoop(makeCanvases(), () => makeState(), jest.fn());
    loop.stop();
    mockRaf.mockClear();
    flushFrames(200);
    // No pending frames to flush since stop was called before frame executed
    expect(mockRaf).not.toHaveBeenCalled();
  });
});

// ── drawShapes ────────────────────────────────────────────────────────────────

describe('drawShapes', () => {
  it('returns false for empty canvas', () => {
    const canvas = document.createElement('canvas');
    jest.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(drawShapes(canvas, makeState(), null)).toBe(false);
  });

  it('calls clearRect on the context', () => {
    const canvas = makeCanvas();
    const state = makeState({
      shapes: [{ shape: 'rect', x: 10, y: 10, width: 50, height: 50 }],
    });
    drawShapes(canvas, state, null);
    expect(canvas.getContext('2d')!.clearRect).toHaveBeenCalled();
  });

  it('skips shapes with visible === false', () => {
    const canvas = makeCanvas();
    const state = makeState({
      shapes: [{ shape: 'rect', x: 0, y: 0, width: 50, height: 50, visible: false }],
    });
    drawShapes(canvas, state, null);
    const ctx = canvas.getContext('2d')!;
    expect(ctx.translate).not.toHaveBeenCalled();
  });

  it('calls a custom drawingFunction when provided', () => {
    const canvas = makeCanvas();
    const customDraw = jest.fn();
    const state = makeState({
      shapes: [{ shape: 'custom', x: 0, y: 0, width: 10, height: 10 }],
    });
    drawShapes(canvas, state, customDraw);
    expect(customDraw).toHaveBeenCalled();
  });
});

// ── drawObjects ───────────────────────────────────────────────────────────────

describe('drawObjects', () => {
  it('returns false when canvas getContext returns null', () => {
    const canvas = document.createElement('canvas');
    jest.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(drawObjects([][Symbol.iterator]() as any, canvas, makeState(), null, false)).toBe(false);
  });

  it('calls clearRect when items is empty iterator', () => {
    const canvas = makeCanvas();
    drawObjects(new Map().values() as any, canvas, makeState(), null, false);
    expect(canvas.getContext('2d')!.clearRect).toHaveBeenCalled();
  });
});
