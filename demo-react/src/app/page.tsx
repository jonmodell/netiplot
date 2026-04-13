'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const BasicDemo = dynamic(() => import('@/demos/BasicDemo'), { ssr: false });
const LayoutDemo = dynamic(() => import('@/demos/LayoutDemo'), { ssr: false });
const DrawingDemo = dynamic(() => import('@/demos/DrawingDemo'), { ssr: false });

const demos = [
  { id: 'basic', label: 'Basic', component: BasicDemo },
  { id: 'options', label: 'With Options', component: null },
  { id: 'shapes', label: 'Node Shapes', component: null },
  { id: 'colors', label: 'Border Colors', component: null },
  { id: 'icons', label: 'Images & Labels', component: null },
  { id: 'hierarchy', label: 'Hierarchy Layout', component: null },
  { id: 'multiparent', label: 'Multi-Parent', component: null },
  { id: 'd3force', label: 'D3 Force Layout', component: null },
  { id: 'tiered', label: 'Tiered Decorator', component: null },
  { id: 'drawing', label: 'Shape Drawing', component: DrawingDemo },
] as const;

type DemoId = typeof demos[number]['id'];

export default function Home() {
  const [activeDemo, setActiveDemo] = useState<DemoId>('basic');

  const renderDemo = () => {
    switch (activeDemo) {
      case 'basic': return <BasicDemo variant="basic" />;
      case 'options': return <BasicDemo variant="options" />;
      case 'shapes': return <BasicDemo variant="shapes" />;
      case 'colors': return <BasicDemo variant="colors" />;
      case 'icons': return <BasicDemo variant="icons" />;
      case 'hierarchy': return <LayoutDemo variant="hierarchy" />;
      case 'multiparent': return <LayoutDemo variant="multiparent" />;
      case 'd3force': return <LayoutDemo variant="d3force" />;
      case 'tiered': return <LayoutDemo variant="tiered" />;
      case 'drawing': return <DrawingDemo />;
      default: return <BasicDemo variant="basic" />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>NetiPlot Network</h1>
        <nav>
          {demos.map((d) => (
            <a
              key={d.id}
              href="#"
              className={activeDemo === d.id ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); setActiveDemo(d.id); }}
            >
              {d.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="main">
        {renderDemo()}
      </div>
    </div>
  );
}
