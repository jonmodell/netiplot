import React from 'react';

interface Tracking {
  itemType: string | null;
  item: any;
  popupPosition?: { x: number; y: number };
}

interface HoverPopupOptions {
  nodeRenderer?: ((item: any) => React.ReactNode) | null;
  edgeRenderer?: ((item: any) => React.ReactNode) | null;
}

interface HoverPopupProps {
  tracking: Tracking;
  options?: HoverPopupOptions;
  clearHover: () => void;
}
const HoverPopup = (props: HoverPopupProps) => {
  const { tracking, options, clearHover } = props;
  const { nodeRenderer, edgeRenderer } = options || {};
  const { itemType, item, popupPosition } = tracking;

  const renderPopup = () => {
    if (!item) {
      return null;
    }

    if (itemType === 'node' && nodeRenderer) {
      return nodeRenderer(item);
    }

    if (itemType === 'edge' && edgeRenderer) {
      return edgeRenderer(item);
    }

    return null;
  };

  if (
    !(itemType === 'node' && nodeRenderer) &&
    !(itemType === 'edge' && edgeRenderer)
  ) {
    return null;
  }

  return (
    <div
      className='node-detail'
      style={{ top: popupPosition?.y, left: popupPosition?.x }}
      onMouseLeave={clearHover}
    >
      {renderPopup()}
    </div>
  );
};

export { HoverPopup };
