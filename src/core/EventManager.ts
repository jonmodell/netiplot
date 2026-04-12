/**
 * EventManagerTarget — the minimal interface that EventManager needs from a
 * host (e.g. NetiplotEngine). Keeping it narrow makes EventManager testable
 * in isolation and decoupled from the full engine.
 */
export interface EventManagerTarget {
  handleMouse(e: MouseEvent): boolean;
  handleMouseWheel(e: WheelEvent): void;
  handleKey(e: KeyboardEvent): boolean;
  handleResize(canvas: HTMLCanvasElement | null): boolean;
}

/**
 * EventManager attaches and removes DOM event listeners on a canvas element,
 * forwarding each event to a target (engine). It also wires up a ResizeObserver
 * so the target is notified whenever the canvas dimensions change.
 *
 * Usage:
 *   const em = new EventManager(canvas, engine);
 *   // later…
 *   em.destroy();
 */
export class EventManager {
  private readonly canvas: HTMLCanvasElement;
  private readonly target: EventManagerTarget;
  private readonly resizeObserver: ResizeObserver;

  // Stable bound references required for removeEventListener
  private readonly onMouse: (e: MouseEvent) => void;
  private readonly onKey: (e: KeyboardEvent) => void;
  private readonly onWheel: (e: WheelEvent) => void;

  constructor(canvas: HTMLCanvasElement, target: EventManagerTarget) {
    this.canvas = canvas;
    this.target = target;

    this.onMouse = (e) => target.handleMouse(e);
    this.onKey = (e) => target.handleKey(e);
    // Wheel must be non-passive so we can preventDefault and capture
    // pinch-to-zoom / trackpad scroll gestures before the browser handles them
    this.onWheel = (e) => {
      e.preventDefault();
      target.handleMouseWheel(e);
    };

    canvas.addEventListener('mousedown', this.onMouse);
    canvas.addEventListener('mousemove', this.onMouse);
    canvas.addEventListener('mouseup', this.onMouse);
    canvas.addEventListener('dblclick', this.onMouse);
    canvas.addEventListener('mouseleave', this.onMouse);
    canvas.addEventListener('keydown', this.onKey);
    canvas.addEventListener('keyup', this.onKey);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });

    this.resizeObserver = new ResizeObserver(() => target.handleResize(canvas));
    this.resizeObserver.observe(canvas);

    // Fire an initial resize so the engine has screen dimensions immediately
    target.handleResize(canvas);
  }

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.onMouse);
    this.canvas.removeEventListener('mousemove', this.onMouse);
    this.canvas.removeEventListener('mouseup', this.onMouse);
    this.canvas.removeEventListener('dblclick', this.onMouse);
    this.canvas.removeEventListener('mouseleave', this.onMouse);
    this.canvas.removeEventListener('keydown', this.onKey);
    this.canvas.removeEventListener('keyup', this.onKey);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.resizeObserver.disconnect();
  }
}
