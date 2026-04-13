import { EventManager } from './EventManager';
import type { EventManagerTarget } from './EventManager';

// jsdom doesn't implement ResizeObserver — provide a minimal mock
let resizeCallback: (() => void) | null = null;

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

class MockResizeObserver {
  constructor(cb: () => void) {
    resizeCallback = cb;
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
}

beforeAll(() => {
  (global as any).ResizeObserver = MockResizeObserver;
});

beforeEach(() => {
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  resizeCallback = null;
});

function makeTarget(): jest.Mocked<EventManagerTarget> {
  return {
    handleMouse: jest.fn((_e: MouseEvent) => true),
    handleMouseWheel: jest.fn((_e: WheelEvent) => {}),
    handleKey: jest.fn((_e: KeyboardEvent) => true),
    handleResize: jest.fn((_canvas: HTMLCanvasElement | null) => true),
  };
}

function makeCanvas(): HTMLCanvasElement {
  return document.createElement('canvas');
}

// ── Construction ──────────────────────────────────────────────────────────────

describe('EventManager construction', () => {
  it('calls handleResize immediately with the canvas', () => {
    const canvas = makeCanvas();
    const target = makeTarget();
    new EventManager(canvas, target);
    expect(target.handleResize).toHaveBeenCalledWith(canvas);
  });

  it('observes the canvas with ResizeObserver', () => {
    const canvas = makeCanvas();
    new EventManager(canvas, makeTarget());
    expect(mockObserve).toHaveBeenCalledWith(canvas);
  });
});

// ── Mouse events ──────────────────────────────────────────────────────────────

describe('mouse event forwarding', () => {
  const mouseEvents = ['mousedown', 'mousemove', 'mouseup', 'dblclick', 'mouseleave'] as const;

  mouseEvents.forEach((type) => {
    it(`forwards ${type} to handleMouse`, () => {
      const canvas = makeCanvas();
      const target = makeTarget();
      new EventManager(canvas, target);
      target.handleMouse.mockClear();

      canvas.dispatchEvent(new MouseEvent(type, { bubbles: true }));
      expect(target.handleMouse).toHaveBeenCalledTimes(1);
    });
  });
});

// ── Key events ────────────────────────────────────────────────────────────────

describe('key event forwarding', () => {
  it('forwards keydown to handleKey', () => {
    const canvas = makeCanvas();
    const target = makeTarget();
    new EventManager(canvas, target);

    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(target.handleKey).toHaveBeenCalledTimes(1);
  });

  it('forwards keyup to handleKey', () => {
    const canvas = makeCanvas();
    const target = makeTarget();
    new EventManager(canvas, target);

    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true }));
    expect(target.handleKey).toHaveBeenCalledTimes(1);
  });
});

// ── Wheel event ───────────────────────────────────────────────────────────────

describe('wheel event forwarding', () => {
  it('forwards wheel events to handleMouseWheel', () => {
    const canvas = makeCanvas();
    const target = makeTarget();
    new EventManager(canvas, target);

    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
    expect(target.handleMouseWheel).toHaveBeenCalledTimes(1);
  });

  it('calls preventDefault on wheel events', () => {
    const canvas = makeCanvas();
    const target = makeTarget();
    new EventManager(canvas, target);

    const e = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    const spy = jest.spyOn(e, 'preventDefault');
    canvas.dispatchEvent(e);
    expect(spy).toHaveBeenCalled();
  });
});

// ── ResizeObserver ────────────────────────────────────────────────────────────

describe('ResizeObserver integration', () => {
  it('calls handleResize again when ResizeObserver fires', () => {
    const canvas = makeCanvas();
    const target = makeTarget();
    new EventManager(canvas, target);
    target.handleResize.mockClear();

    resizeCallback!();
    expect(target.handleResize).toHaveBeenCalledWith(canvas);
  });
});

// ── Destroy ───────────────────────────────────────────────────────────────────

describe('destroy', () => {
  it('disconnects the ResizeObserver', () => {
    const canvas = makeCanvas();
    const em = new EventManager(canvas, makeTarget());
    em.destroy();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('stops forwarding mouse events after destroy', () => {
    const canvas = makeCanvas();
    const target = makeTarget();
    const em = new EventManager(canvas, target);
    em.destroy();
    target.handleMouse.mockClear();

    canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(target.handleMouse).not.toHaveBeenCalled();
  });

  it('stops forwarding key events after destroy', () => {
    const canvas = makeCanvas();
    const target = makeTarget();
    const em = new EventManager(canvas, target);
    em.destroy();
    target.handleKey.mockClear();

    canvas.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    expect(target.handleKey).not.toHaveBeenCalled();
  });

  it('stops forwarding wheel events after destroy', () => {
    const canvas = makeCanvas();
    const target = makeTarget();
    const em = new EventManager(canvas, target);
    em.destroy();
    target.handleMouseWheel.mockClear();

    canvas.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    expect(target.handleMouseWheel).not.toHaveBeenCalled();
  });
});
