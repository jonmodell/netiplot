import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HoverPopup } from './HoverPopup';

const noItem = { item: null, itemType: null };
const nodeItem = { item: { id: 'n1', label: 'Node 1' }, itemType: 'node', popupPosition: { x: 100, y: 200 } };
const edgeItem = { item: { id: 'e1', label: 'Edge 1' }, itemType: 'edge', popupPosition: { x: 50, y: 80 } };

describe('HoverPopup', () => {
  it('renders nothing when item is null', () => {
    const { container } = render(
      <HoverPopup tracking={noItem} clearHover={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when item exists but no renderer is configured', () => {
    const { container } = render(
      <HoverPopup tracking={nodeItem} clearHover={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders node popup when nodeRenderer is provided and itemType is node', () => {
    render(
      <HoverPopup
        tracking={nodeItem}
        options={{ nodeRenderer: (item) => <span data-testid="popup">{item.label}</span> }}
        clearHover={jest.fn()}
      />
    );
    expect(screen.getByTestId('popup').textContent).toBe('Node 1');
  });

  it('renders edge popup when edgeRenderer is provided and itemType is edge', () => {
    render(
      <HoverPopup
        tracking={edgeItem}
        options={{ edgeRenderer: (item) => <span data-testid="edge-popup">{item.label}</span> }}
        clearHover={jest.fn()}
      />
    );
    expect(screen.getByTestId('edge-popup').textContent).toBe('Edge 1');
  });

  it('does not render node popup for edge item', () => {
    const { container } = render(
      <HoverPopup
        tracking={edgeItem}
        options={{ nodeRenderer: (item) => <span>{item.label}</span> }}
        clearHover={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('positions popup at popupPosition', () => {
    const { container } = render(
      <HoverPopup
        tracking={nodeItem}
        options={{ nodeRenderer: (item) => <span>{item.label}</span> }}
        clearHover={jest.fn()}
      />
    );
    const div = container.querySelector('.node-detail') as HTMLElement;
    expect(div.style.top).toBe('200px');
    expect(div.style.left).toBe('100px');
  });

  it('calls clearHover on mouse leave', () => {
    const clearHover = jest.fn();
    const { container } = render(
      <HoverPopup
        tracking={nodeItem}
        options={{ nodeRenderer: (item) => <span>{item.label}</span> }}
        clearHover={clearHover}
      />
    );
    const div = container.querySelector('.node-detail')!;
    fireEvent.mouseLeave(div);
    expect(clearHover).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when nodeRenderer is null', () => {
    const { container } = render(
      <HoverPopup
        tracking={nodeItem}
        options={{ nodeRenderer: null }}
        clearHover={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
