'use client';

import { useState, useRef, useCallback } from 'react';
import { RevisNetwork } from 'netiplot';
import type { RevisShapeDefinition } from 'netiplot';
import {
  iconMap,
  nodeDrawing,
  shapeDrawing,
  data,
  shapes as initialShapes,
  image1,
} from '@/examples/drawing';

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
  const shapesRef = useRef<RevisShapeDefinition[]>([...initialShapes]);
  const [, forceRender] = useState(0);
  const [editingText, setEditingText] = useState<{ id: string; text: string } | null>(null);

  const addShapeOfType = (type: string) => {
    const base = { id: Date.now().toString(), x: 10, y: 10 };
    const defaults: Record<string, any> = {
      rectangle: { width: 150, height: 100, shape: 'rectangle', style: { fill: '#4488cc', line: '#222', lineWidth: 1 } },
      square: { size: 100, shape: 'square', style: { fill: '#44cc88', line: '#222', lineWidth: 1 } },
      circle: { size: 100, shape: 'circle', style: { fill: '#cc4488', line: '#222', lineWidth: 1 } },
      ellipse: { width: 150, height: 100, shape: 'ellipse', style: { fill: '#8844cc', line: '#222', lineWidth: 1 } },
      cloud: { width: 200, height: 120, shape: 'cloud', style: { fill: '#ee4455', line: '#33ee33', lineWidth: 1 } },
      hexagon: { size: 100, shape: 'hexagon', style: { fill: '#cc8811', line: '#222', lineWidth: 1 } },
      polygon: { size: 100, shape: 'polygon', faces: 8, style: { fill: '#cc8811', line: '#33ee33', lineWidth: 1 } },
      text: { width: 300, height: 60, shape: 'text', text: 'Hello World', fontSize: 18, textAlign: 'left', background: true, style: { fill: '#d3429e' } },
      line: { width: 200, height: 0, shape: 'line', style: { line: '#222', lineWidth: 2 } },
      image: { width: 200, height: 200, shape: 'image', image: image1 },
    };
    shapesRef.current = [...shapesRef.current, { ...base, ...defaults[type] }];
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

  const commitTextEdit = () => {
    if (!editingText) return;
    shapesRef.current = shapesRef.current.map((s) =>
      s.id === editingText.id ? { ...s, text: editingText.text } : s
    );
    setEditingText(null);
    forceRender((n) => n + 1);
  };

  const onMouse = useCallback((type: string, ...args: any[]) => {
    console.log('onMouse:', type, ...args);
    if (type === 'shapeDblClick') {
      const shape = args[0];
      if (shape?.shape === 'text') {
        setEditingText({ id: shape.id, text: shape.text || '' });
      }
    }
  }, []);

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
        <button onClick={() => addShapeOfType('rectangle')}>Rectangle</button>
        <button onClick={() => addShapeOfType('square')}>Square</button>
        <button onClick={() => addShapeOfType('circle')}>Circle</button>
        <button onClick={() => addShapeOfType('ellipse')}>Ellipse</button>
        <button onClick={() => addShapeOfType('cloud')}>Cloud</button>
        <button onClick={() => addShapeOfType('hexagon')}>Hexagon</button>
        <button onClick={() => addShapeOfType('polygon')}>Polygon</button>
        <button onClick={() => addShapeOfType('text')}>Text</button>
        <button onClick={() => addShapeOfType('line')}>Line</button>
        <button onClick={() => addShapeOfType('image')}>Image</button>
        <button onClick={deleteTop}>Delete Top</button>
        <button onClick={randomColor}>Random Color</button>
      </div>
      <div className="description">
        Use the controls to add, delete, and edit shapes. Toggle &quot;Edit Shapes&quot; to drag and resize.
        Double-click a text shape to edit its content.
      </div>
      <div className="network-container" style={{ position: 'relative' }}>
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
        {editingText && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              zIndex: 100,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) commitTextEdit(); }}
          >
            <div style={{ background: '#fff', borderRadius: 8, padding: 16, minWidth: 320, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Edit Text</div>
              <textarea
                autoFocus
                value={editingText.text}
                onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTextEdit(); } }}
                style={{ width: '100%', minHeight: 80, padding: 8, fontSize: 14, border: '1px solid #ccc', borderRadius: 4, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditingText(null)}>Cancel</button>
                <button onClick={commitTextEdit}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
