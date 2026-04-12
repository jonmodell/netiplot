'use client';

import { useState, useMemo, useCallback } from 'react';
import { RevisNetwork } from 'netiplot';
import basicData from '@/examples/data/basic';
import shapeData from '@/examples/data/basicShapes';
import shapeColorData from '@/examples/data/basicStyled';
import shapeIconData from '@/examples/data/basicStyledWithIcons';
import nodeDrawing from '@/examples/drawing/nodeDrawing';
import images from '@/examples/data/images';
import randomData from '@/examples/data/random';

const onMouse = (type: string, ...args: any[]) => {
  console.log('onMouse:', type, ...args);
};

function BasicVariant() {
  return (
    <>
      <div className="description">
        A basic example with very few props in the data, and no other options set.
      </div>
      <div className="network-container">
        <RevisNetwork graph={basicData} onMouse={onMouse} />
      </div>
    </>
  );
}

function OptionsVariant() {
  const [nodeCount, setNodeCount] = useState(20);
  const [nodeSize, setNodeSize] = useState(30);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [straightEdges, setStraightEdges] = useState(false);
  const [arrowheads, setArrowheads] = useState(false);

  const graph = useMemo(() => randomData(nodeCount), [nodeCount]);

  const [callbackProps, setCallbackProps] = useState<any>(null);
  const callbackFn = useCallback((props: any) => setCallbackProps(props), []);

  return (
    <>
      <div className="toolbar">
        <h2>Options</h2>
        <label>
          Nodes: <input type="number" value={nodeCount} min={2} max={200}
            onChange={(e) => setNodeCount(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          Size: <input type="number" value={nodeSize} min={10} max={100}
            onChange={(e) => setNodeSize(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          <input type="checkbox" checked={showNodeLabels}
            onChange={(e) => setShowNodeLabels(e.target.checked)} /> Node Labels
        </label>
        <label>
          <input type="checkbox" checked={showEdgeLabels}
            onChange={(e) => setShowEdgeLabels(e.target.checked)} /> Edge Labels
        </label>
        <label>
          <input type="checkbox" checked={straightEdges}
            onChange={(e) => setStraightEdges(e.target.checked)} /> Straight Edges
        </label>
        <label>
          <input type="checkbox" checked={arrowheads}
            onChange={(e) => setArrowheads(e.target.checked)} /> Arrowheads
        </label>
        <button onClick={() => callbackProps?.getPositions && console.log(callbackProps.getPositions())}>
          Log Positions
        </button>
        <button onClick={() => callbackProps?.fit && callbackProps.fit()}>
          Fit All
        </button>
      </div>
      <div className="network-container">
        <RevisNetwork
          graph={graph}
          onMouse={onMouse}
          images={images}
          callbackFn={callbackFn}
          options={{
            nodes: { showLabels: showNodeLabels, defaultSize: nodeSize },
            edges: {
              showLabels: showEdgeLabels,
              lineStyle: straightEdges ? 'straight' : 'curved',
              arrowheads,
            },
          }}
        />
      </div>
    </>
  );
}

function ShapesVariant() {
  return (
    <>
      <div className="description">
        A nodeDrawingFunction uses the node &quot;shape&quot; property to draw circles, diamonds, and hexagons.
      </div>
      <div className="network-container">
        <RevisNetwork graph={shapeData} nodeDrawingFunction={nodeDrawing} onMouse={onMouse} />
      </div>
    </>
  );
}

function ColorsVariant() {
  return (
    <>
      <div className="description">
        Style added to the nodes and edges can provide color and line options.
      </div>
      <div className="network-container">
        <RevisNetwork graph={shapeColorData} nodeDrawingFunction={nodeDrawing} onMouse={onMouse} />
      </div>
    </>
  );
}

function IconsVariant() {
  return (
    <>
      <div className="description">
        SVG or raster images as icons, with innerLabel props for text inside nodes.
      </div>
      <div className="network-container">
        <RevisNetwork
          graph={shapeIconData}
          nodeDrawingFunction={nodeDrawing}
          images={images}
          onMouse={onMouse}
        />
      </div>
    </>
  );
}

export default function BasicDemo({ variant = 'basic' }: { variant?: string }) {
  switch (variant) {
    case 'options': return <OptionsVariant />;
    case 'shapes': return <ShapesVariant />;
    case 'colors': return <ColorsVariant />;
    case 'icons': return <IconsVariant />;
    default: return <BasicVariant />;
  }
}
