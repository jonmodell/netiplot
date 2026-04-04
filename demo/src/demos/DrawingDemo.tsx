'use client';

import { useState, useRef } from 'react';
import { RevisNetwork } from 'revis-network-ts';
import {
  iconMap,
  nodeDrawing,
  shapeDrawing,
  data,
  shapes as initialShapes,
  image1,
} from '@/examples/drawing';

const onMouse = (type: string, ...args: any[]) => {
  console.log('onMouse:', type, ...args);
};

const nodeRenderer = () => (
  <div style={{ position: 'absolute', width: 200, maxHeight: 150, overflowY: 'auto' }}>
    <div style={{ height: 200, width: '100%', background: '#CCCCCC' }}>
      Node hover content
    </div>
  </div>
);

const edgeRenderer = () => (
  <div style={{ position: 'absolute', width: 200, maxHeight: 150, overflowY: 'auto' }}>
    <div style={{ height: 200, width: '100%', background: '#CCCCCC' }}>
      Edge hover content
    </div>
  </div>
);

export default function DrawingDemo() {
  const [editShapes, setEditShapes] = useState(false);
  const shapesRef = useRef<any[]>([...initialShapes]);
  const [, forceRender] = useState(0);

  const addShape = () => {
    shapesRef.current = [
      ...shapesRef.current,
      {
        id: Date.now().toString(),
        width: 100,
        height: 100,
        x: 10,
        y: 10,
        shape: 'rectangle',
      },
    ];
    forceRender((n) => n + 1);
  };

  const addImage = () => {
    shapesRef.current = [
      ...shapesRef.current,
      {
        id: Date.now().toString(),
        width: 200,
        height: 200,
        x: 200,
        y: 200,
        shape: 'image',
        image: image1,
      },
    ];
    forceRender((n) => n + 1);
  };

  const deleteTop = () => {
    shapesRef.current = shapesRef.current.slice(0, -1);
    forceRender((n) => n + 1);
  };

  const randomColor = () => {
    const hex = `#${((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0')}`;
    const newData = [...shapesRef.current];
    if (newData.length > 0) {
      newData[newData.length - 1] = {
        ...newData[newData.length - 1],
        style: { background: hex },
      };
      shapesRef.current = newData;
      forceRender((n) => n + 1);
    }
  };

  return (
    <>
      <div className="toolbar">
        <h2>Shape Drawing</h2>
        <label>
          <input
            type="checkbox"
            checked={editShapes}
            onChange={(e) => setEditShapes(e.target.checked)}
          />{' '}
          Edit Shapes
        </label>
        <button onClick={addShape}>Add Rectangle</button>
        <button onClick={addImage}>Add Image</button>
        <button onClick={deleteTop}>Delete Top</button>
        <button onClick={randomColor}>Random Color</button>
      </div>
      <div className="description">
        Use the controls to add, delete, and edit shapes. Toggle &quot;Edit Shapes&quot; to drag and resize.
      </div>
      <div className="network-container">
        <RevisNetwork
          graph={data}
          shapes={shapesRef.current}
          onMouse={onMouse}
          images={iconMap}
          nodeDrawingFunction={nodeDrawing}
          shapeDrawingFunction={shapeDrawing}
          options={{
            interaction: {
              allowGraphInteraction: !editShapes,
              allowShapeInteraction: editShapes,
            },
            nodes: { defaultSize: 60 },
            edges: { lineStyle: 'straight' },
            hover: {
              edgeRenderer: (n: any) => edgeRenderer(),
              nodeRenderer: (n: any) => nodeRenderer(),
            },
          }}
        />
      </div>
    </>
  );
}
