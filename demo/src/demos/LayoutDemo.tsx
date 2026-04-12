'use client';

import { useState, useMemo } from 'react';
import { RevisNetwork } from '@jonmodell/netiplot';
import randomData from '@/examples/data/random';
import images from '@/examples/data/images';
import hierarchical from '@/examples/layouts/hierarchical';
import multiParentHierarchical from '@/examples/layouts/multiParentHierarchical';
import force from '@/examples/layouts/force';
import tieredDecorator from '@/examples/layouts/tieredDecorator';
import decorations from '@/examples/layouts/tieredDecorator/shapes';
import decorationsDrawingFunction from '@/examples/layouts/tieredDecorator/shapeDrawing';
import tieredNodeDrawing from '@/examples/layouts/tieredDecorator/nodeDrawing';

const onMouse = (type: string, ...args: any[]) => {
  console.log('onMouse:', type, ...args);
};

const graph100 = randomData(100);
const graph50 = randomData(50);

function HierarchyVariant() {
  const [direction, setDirection] = useState('UD');
  const [hSpacing, setHSpacing] = useState(100);
  const [vSpacing, setVSpacing] = useState(100);
  const [isDirected, setIsDirected] = useState(true);
  const [screenSize, setScreenSize] = useState(false);

  return (
    <>
      <div className="toolbar">
        <h2>Hierarchy</h2>
        <label>
          Direction:
          <select value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="UD">Up to Down</option>
            <option value="DU">Down to Up</option>
            <option value="LR">Left to Right</option>
            <option value="RL">Right to Left</option>
          </select>
        </label>
        <label>
          H-Spacing: <input type="number" value={hSpacing} min={20} max={300}
            onChange={(e) => setHSpacing(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          V-Spacing: <input type="number" value={vSpacing} min={20} max={300}
            onChange={(e) => setVSpacing(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          <input type="checkbox" checked={isDirected}
            onChange={(e) => setIsDirected(e.target.checked)} /> Directed
        </label>
        <label>
          <input type="checkbox" checked={screenSize}
            onChange={(e) => setScreenSize(e.target.checked)} /> Space by Screen
        </label>
      </div>
      <div className="network-container">
        <RevisNetwork
          graph={graph100}
          onMouse={onMouse}
          images={images}
          layouter={hierarchical}
          options={{
            layoutOptions: {
              horizontalNodeSpacing: hSpacing,
              verticalNodeSpacing: vSpacing,
              isDirected,
              direction,
              spaceNodesByScreenSize: screenSize,
            },
          }}
        />
      </div>
    </>
  );
}

function MultiParentVariant() {
  const [hSpacing, setHSpacing] = useState(100);
  const [vSpacing, setVSpacing] = useState(100);
  const [screenSize, setScreenSize] = useState(false);

  return (
    <>
      <div className="toolbar">
        <h2>Multi-Parent Hierarchy (dagre)</h2>
        <label>
          H-Spacing: <input type="number" value={hSpacing} min={20} max={300}
            onChange={(e) => setHSpacing(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          V-Spacing: <input type="number" value={vSpacing} min={20} max={300}
            onChange={(e) => setVSpacing(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          <input type="checkbox" checked={screenSize}
            onChange={(e) => setScreenSize(e.target.checked)} /> Space by Screen
        </label>
      </div>
      <div className="network-container">
        <RevisNetwork
          graph={graph100}
          onMouse={onMouse}
          images={images}
          layouter={multiParentHierarchical}
          options={{
            layoutOptions: {
              horizontalNodeSpacing: hSpacing,
              verticalNodeSpacing: vSpacing,
              spaceNodesByScreenSize: screenSize,
            },
          }}
        />
      </div>
    </>
  );
}

function D3ForceVariant() {
  const [spacing, setSpacing] = useState(5);
  const [alphaMin, setAlphaMin] = useState(0.05);
  const [forceType, setForceType] = useState('directedTree');

  return (
    <>
      <div className="toolbar">
        <h2>D3 Force Layout</h2>
        <label>
          Type:
          <select value={forceType} onChange={(e) => setForceType(e.target.value)}>
            <option value="directedTree">Directed Tree</option>
            <option value="forceCenter">Centered</option>
            <option value="disjoint">Disjoint</option>
          </select>
        </label>
        <label>
          Spacing: <input type="number" value={spacing} min={1} max={20}
            onChange={(e) => setSpacing(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          Alpha Min: <input type="number" value={alphaMin} min={0.01} max={0.5} step={0.01}
            onChange={(e) => setAlphaMin(Number(e.target.value))} style={{ width: 70 }} />
        </label>
      </div>
      <div className="network-container">
        <RevisNetwork
          graph={graph100}
          onMouse={onMouse}
          images={images}
          layouter={force}
          options={{ layoutOptions: { forceNodeSpacing: spacing, forceType, alphaMin } }}
        />
      </div>
    </>
  );
}

function TieredVariant() {
  const [hSpacing, setHSpacing] = useState(50);
  const [vSpacing, setVSpacing] = useState(100);
  const [decoSpacing, setDecoSpacing] = useState(20);

  return (
    <>
      <div className="toolbar">
        <h2>Tiered Decorator</h2>
        <label>
          H-Spacing: <input type="number" value={hSpacing} min={20} max={300}
            onChange={(e) => setHSpacing(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          V-Spacing: <input type="number" value={vSpacing} min={20} max={300}
            onChange={(e) => setVSpacing(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          Deco-Spacing: <input type="number" value={decoSpacing} min={0} max={100}
            onChange={(e) => setDecoSpacing(Number(e.target.value))} style={{ width: 60 }} />
        </label>
      </div>
      <div className="network-container">
        <RevisNetwork
          graph={graph50}
          onMouse={onMouse}
          images={images}
          layouter={tieredDecorator}
          shapes={decorations as any}
          nodeDrawingFunction={tieredNodeDrawing}
          shapeDrawingFunction={decorationsDrawingFunction}
          options={{
            layoutOptions: {
              horizontalNodeSpacing: hSpacing,
              verticalNodeSpacing: vSpacing,
              decoratorSpacing: decoSpacing,
            },
          }}
        />
      </div>
    </>
  );
}

export default function LayoutDemo({ variant = 'hierarchy' }: { variant?: string }) {
  switch (variant) {
    case 'multiparent': return <MultiParentVariant />;
    case 'd3force': return <D3ForceVariant />;
    case 'tiered': return <TieredVariant />;
    default: return <HierarchyVariant />;
  }
}
