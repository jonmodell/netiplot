import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';

const ActionLayer = (props: { handlers?: any; handleMouse?: any; handleMouseWheel?: any; handleKey?: any; }) => {
  const { handlers, handleMouse, handleMouseWheel, handleKey } = props;

  const actionRef = useRef<HTMLCanvasElement>(null);
  const handleMouseWheelRef = useRef(handleMouseWheel);
  handleMouseWheelRef.current = handleMouseWheel;

  const onResize = () => {
    if (!actionRef?.current) {
      handlers && handlers('resize', null);
      return false;
    }

    handlers && handlers('resize', actionRef.current);

    return true;
  };

  useResizeDetector({
    targetRef: actionRef,
    onResize,
  });

  // send the actual screen size on the first render only
  useLayoutEffect(() => {
    onResize();
  }, []);

  // Attach wheel listener as non-passive so we can preventDefault to capture
  // pinch-to-zoom gestures (trackpad/touch) instead of letting the browser zoom
  useEffect(() => {
    const canvas = actionRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleMouseWheelRef.current && handleMouseWheelRef.current(e);
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <canvas
      ref={actionRef}
      tabIndex={0}
      className='action-canvas'
      onMouseDown={handleMouse}
      onMouseMove={handleMouse}
      onDoubleClick={handleMouse}
      onMouseUp={handleMouse}
      onMouseLeave={handleMouse}
      onKeyDown={handleKey}
      onKeyUp={handleKey}
    />
  );
};

export default ActionLayer;
