import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { NetiPlotReact } from './NetiPlotReact';
import type { NetiPlotGraph, NetiPlotCallbackData, NetiPlotOptions } from './types';

// ─── Canvas mock ─────────────────────────────────────────────────────────────
// jsdom doesn't implement canvas — mock getContext so NetiPlotNode/Edge don't crash

const ctxMock = {
  save: jest.fn(),
  restore: jest.fn(),
  clearRect: jest.fn(),
  transform: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  quadraticCurveTo: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  drawImage: jest.fn(),
  rect: jest.fn(),
  createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'center',
};

beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: jest.fn(() => ctxMock),
  });
  // ResizeObserver is not in jsdom
  global.ResizeObserver = class ResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  };
  // requestAnimationFrame must NOT call callback synchronously — Renderer loops recursively
  let rafId = 0;
  global.requestAnimationFrame = jest.fn(() => ++rafId);
  global.cancelAnimationFrame = jest.fn();
});

// ─── Test data ────────────────────────────────────────────────────────────────

const twoNodeGraph: NetiPlotGraph = {
  nodes: [
    { id: 'n1', x: 100, y: 100 },
    { id: 'n2', x: 200, y: 150 },
  ],
  edges: [{ id: 'e1', from: 'n1', to: 'n2' }],
};

const emptyGraph: NetiPlotGraph = { nodes: [], edges: [] };

const graphInteractionOptions: NetiPlotOptions = {
  interaction: { allowGraphInteraction: true },
};

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('NetiPlotReact rendering', () => {
  it('renders without crashing with empty graph', () => {
    render(<NetiPlotReact graph={emptyGraph} />);
    // Renderer wraps everything in .netiplot-container
    expect(document.querySelector('.netiplot-container')).not.toBeNull();
  });

  it('renders canvases', () => {
    render(<NetiPlotReact graph={twoNodeGraph} />);
    const canvases = document.querySelectorAll('canvas');
    expect(canvases.length).toBeGreaterThan(0);
  });

  it('renders zoom controls by default', () => {
    render(<NetiPlotReact graph={emptyGraph} />);
    expect(document.querySelector('.controls')).not.toBeNull();
  });

  it('hides zoom controls when customControls is null', () => {
    render(<NetiPlotReact graph={emptyGraph} customControls={null} />);
    expect(document.querySelector('.controls')).toBeNull();
  });

  it('renders custom zoom controls when provided', () => {
    render(
      <NetiPlotReact
        graph={emptyGraph}
        customControls={() => <div data-testid="my-controls">custom</div>}
      />
    );
    expect(screen.getByTestId('my-controls')).toBeInTheDocument();
  });

  it('applies className to container', () => {
    render(<NetiPlotReact graph={emptyGraph} className="my-network" />);
    const container = document.querySelector('.netiplot-container');
    expect(container?.classList.contains('my-network')).toBe(true);
  });
});

// ─── callbackFn ──────────────────────────────────────────────────────────────

describe('NetiPlotReact callbackFn', () => {
  it('calls callbackFn with network API', () => {
    const callbackFn = jest.fn();
    render(<NetiPlotReact graph={twoNodeGraph} callbackFn={callbackFn} />);
    expect(callbackFn).toHaveBeenCalled();
    const data: NetiPlotCallbackData = callbackFn.mock.calls[0][0];
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('getPositions');
    expect(data).toHaveProperty('getCamera');
    expect(data).toHaveProperty('fit');
  });

  it('getPositions returns positions for each node', () => {
    const callbackFn = jest.fn();
    render(<NetiPlotReact graph={twoNodeGraph} callbackFn={callbackFn} />);
    const data: NetiPlotCallbackData = callbackFn.mock.calls[0][0];
    const positions = data.getPositions();
    expect(positions).toHaveProperty('n1');
    expect(positions).toHaveProperty('n2');
  });

  it('getCamera returns a PanScaleState with scale and pan', () => {
    const callbackFn = jest.fn();
    render(<NetiPlotReact graph={twoNodeGraph} callbackFn={callbackFn} />);
    const data: NetiPlotCallbackData = callbackFn.mock.calls[0][0];
    const cam = data.getCamera();
    expect(cam).toHaveProperty('scale');
    expect(cam).toHaveProperty('pan');
  });
});

// ─── onMouse ─────────────────────────────────────────────────────────────────

describe('NetiPlotReact onMouse', () => {
  it('fires backgroundClick when clicking background with graph interaction enabled', async () => {
    const onMouse = jest.fn();
    render(
      <NetiPlotReact
        graph={twoNodeGraph}
        onMouse={onMouse}
        options={graphInteractionOptions}
      />
    );
    const actionCanvas = document.querySelector('.action-canvas') as HTMLElement;
    // mousedown on empty area = backgroundClick on mouseup
    act(() => {
      actionCanvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 500, clientY: 500 }));
      actionCanvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 500, clientY: 500 }));
    });
    await waitFor(() => {
      expect(onMouse).toHaveBeenCalledWith('backgroundClick', null, expect.anything());
    });
  });
});

// ─── Graph updates ───────────────────────────────────────────────────────────

describe('NetiPlotReact graph updates', () => {
  it('adds new nodes when graph prop changes', async () => {
    const callbackFn = jest.fn();
    const { rerender } = render(
      <NetiPlotReact graph={emptyGraph} callbackFn={callbackFn} />
    );
    rerender(
      <NetiPlotReact graph={twoNodeGraph} callbackFn={callbackFn} />
    );
    await waitFor(() => {
      const lastCall = callbackFn.mock.calls[callbackFn.mock.calls.length - 1][0] as NetiPlotCallbackData;
      const positions = lastCall.getPositions();
      expect(positions).toHaveProperty('n1');
      expect(positions).toHaveProperty('n2');
    });
  });

  it('removes nodes when they are dropped from the graph', async () => {
    const callbackFn = jest.fn();
    const { rerender } = render(
      <NetiPlotReact graph={twoNodeGraph} callbackFn={callbackFn} />
    );
    const oneNodeGraph: NetiPlotGraph = {
      nodes: [{ id: 'n1', x: 100, y: 100 }],
      edges: [],
    };
    rerender(
      <NetiPlotReact graph={oneNodeGraph} callbackFn={callbackFn} />
    );
    await waitFor(() => {
      const lastCall = callbackFn.mock.calls[callbackFn.mock.calls.length - 1][0] as NetiPlotCallbackData;
      const positions = lastCall.getPositions();
      expect(positions).toHaveProperty('n1');
      expect(positions).not.toHaveProperty('n2');
    });
  });
});

// ─── identifier ──────────────────────────────────────────────────────────────

describe('NetiPlotReact identifier', () => {
  it('uses provided identifier as uid prefix area', () => {
    render(<NetiPlotReact graph={emptyGraph} identifier="test-net" />);
    // Component renders (no crash); uid is internal but container exists
    expect(document.querySelector('.netiplot-container')).not.toBeNull();
  });
});
