import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from './ZoomControls';

describe('ZoomControls', () => {
  it('renders four buttons by default', () => {
    render(<ZoomControls zoom={jest.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('calls zoom with "in" when zoom-in button clicked', () => {
    const zoom = jest.fn();
    render(<ZoomControls zoom={zoom} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(zoom).toHaveBeenCalledWith(expect.anything(), 'in');
  });

  it('calls zoom with "out" when zoom-out button clicked', () => {
    const zoom = jest.fn();
    render(<ZoomControls zoom={zoom} />);
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(zoom).toHaveBeenCalledWith(expect.anything(), 'out');
  });

  it('calls zoom with "all" when fit-all button clicked', () => {
    const zoom = jest.fn();
    render(<ZoomControls zoom={zoom} />);
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(zoom).toHaveBeenCalledWith(expect.anything(), 'all');
  });

  it('calls zoom with "selection" when fit-selection button clicked', () => {
    const zoom = jest.fn();
    render(<ZoomControls zoom={zoom} />);
    fireEvent.click(screen.getAllByRole('button')[3]);
    expect(zoom).toHaveBeenCalledWith(expect.anything(), 'selection');
  });

  it('renders custom controls when customControls prop is provided', () => {
    const customControls = jest.fn(() => <div data-testid="custom">custom</div>);
    render(<ZoomControls zoom={jest.fn()} customControls={customControls} />);
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(customControls).toHaveBeenCalledWith(
      expect.objectContaining({ zoomIn: expect.any(Function), zoomOut: expect.any(Function), fitAll: expect.any(Function), fitSelection: expect.any(Function) })
    );
  });

  it('does not render default buttons when customControls is provided', () => {
    render(<ZoomControls zoom={jest.fn()} customControls={() => <div>custom</div>} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('passes working zoom functions to customControls', () => {
    const zoom = jest.fn();
    let capturedControls: any;
    render(
      <ZoomControls
        zoom={zoom}
        customControls={(controls: Record<string, Function>) => {
          capturedControls = controls;
          return <div />;
        }}
      />
    );
    capturedControls.zoomIn({ preventDefault: jest.fn() });
    expect(zoom).toHaveBeenCalledWith(expect.anything(), 'in');
  });
});
