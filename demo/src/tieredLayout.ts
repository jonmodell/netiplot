/**
 * Tiered decorator layout — TypeScript port of demo-react/src/examples/layouts/tieredDecorator/index.js
 * Ramda (pipe, tap, mergeDeepRight) replaced with plain functions.
 */

// ── Simple replacements for the three ramda helpers used ─────────────────────

function mergeDeepRight(a: any, b: any): any {
  const result: any = { ...a };
  for (const key of Object.keys(b ?? {})) {
    if (
      b[key] && typeof b[key] === 'object' && !Array.isArray(b[key]) &&
      a[key] && typeof a[key] === 'object' && !Array.isArray(a[key])
    ) {
      result[key] = mergeDeepRight(a[key], b[key]);
    } else {
      result[key] = b[key];
    }
  }
  return result;
}

// ── Tiered-specific layout utilities (from tieredDecorator/utils.js) ─────────

const compareByParentChild = (a: any, b: any) => {
  const aVal = a.isParent && !a.isChild ? 1 : 0;
  const bVal = b.isParent && !b.isChild ? 1 : 0;
  return bVal - aVal || b.mass - a.mass;
};

const compareByMass = (a: any, b: any) => {
  const aVal = a.mass || 0;
  const bVal = b.mass || 0;
  return bVal - aVal;
};

const assignEdgeParentChild = (edge: any) => {
  edge.end.isChild = true;
  edge.start.isParent = true;
};

const getWidth = (node: any): number => {
  if (node) {
    const w = Math.max(1, node.children.reduce((acc: number, c: any) => acc + getWidth(c), 0));
    node.width = w;
    return w;
  }
  return 1;
};

const crawl = (
  props: any,
  nodeCallback: (node: any, child: any) => void = () => {},
  childCondition: (child: any) => boolean = (child) => child.rank === null,
) => (node: any) => {
  const { edges } = props.data;
  const { isDirected } = props.options;
  edges.forEach((edge: any) => {
    const nid = node.id.toString();
    let child;
    if (!isDirected && edge.definition.to.toString() === nid && edge.definition.to !== edge.from) {
      child = edge.start;
    } else if (edge.definition.from.toString() === nid && edge.definition.to !== edge.from) {
      child = edge.end;
    }
    if (child && childCondition(child) && child.parent === undefined) {
      child.parent = node;
      nodeCallback(node, child);
      node.children.push(child);
    }
  });
  node.children.sort((a: any, b: any) => a.mass - b.mass);
  node.children.forEach((child: any) => {
    crawl(props, nodeCallback, childCondition)(child);
  });
  getWidth(node);
};

const shouldAssignCoords = ({ x, y, fixed }: any) =>
  x == null || y == null || fixed == null;

const assignCoords = (getCoords: (node: any) => any) => (node: any) => {
  const { x, y } = getCoords(node);
  if (node.x !== undefined || node.y !== undefined) {
    node.destination = { x, y };
  } else {
    node.x = x;
    node.y = y;
  }
};

const getCoordsKeyValuePairs = (coords: any[]): [string, any][] =>
  coords.map((c) => [c.id, c]);

const orderNodes = (
  getNodeRank = (node: any) => node.rank,
  getMaxRank = ({ extras: { maxRank } }: any) => maxRank,
) => (props: any) => {
  const { nodes } = props.data;
  const maxRank = getMaxRank(props);
  for (let rank = 0; rank <= maxRank; rank++) {
    const rankNodes = nodes.filter((n: any) => getNodeRank(n) === rank);
    rankNodes.sort((a: any, b: any) => {
      const aVal = a?.parent?.order || 0;
      const bVal = b?.parent?.order || 0;
      return aVal - bVal || (b.width || 0) - (a.width || 0) || (b.mass || 0) - (a.mass || 0);
    });
    rankNodes.forEach((n: any, i: number) => { n.order = i; });
  }
};

// ── Tiered layout phases ──────────────────────────────────────────────────────

const resetNodes = ({ data: { nodes }, options: { groupingOrder } }: any) =>
  nodes.forEach((node: any) => {
    node.rank = null;
    node.preRank = null;
    node.order = null;
    node.children = [];
    delete node.parent;
    if (node.decorationType === undefined) {
      node.decorationType = node.definition.type || 'unknown';
    }
    node.groupingIndex = groupingOrder.indexOf(node.decorationType.toLowerCase());
    if (node.groupingIndex === -1) node.groupingIndex = groupingOrder.length - 1;
  });

const rankNodes = (props: any): any => {
  const { edges, nodes } = props.data;
  const { isDirected } = props.options;
  let maxPreRank = 0;

  const crawlAndSetPreRank = crawl(
    props,
    (node, child) => { child.preRank = node.preRank + 1; maxPreRank = Math.max(maxPreRank, child.preRank); },
    (child) => child.preRank === null,
  );

  const assignPreRank = (node: any) => {
    if (node.preRank === null) { node.preRank = 0; crawlAndSetPreRank(node); }
  };

  if (isDirected) {
    edges.forEach(assignEdgeParentChild);
    nodes.sort(compareByParentChild).forEach(assignPreRank);
  } else {
    nodes.sort(compareByMass).forEach(assignPreRank);
  }
  return mergeDeepRight(props, { extras: { maxPreRank } });
};

const groupNodes = (props: any): any => {
  const { nodes } = props.data;
  const { groupingOrder } = props.options;
  const { scr } = props;
  let maxRank = 0;

  const groupings: any[] = [];
  groupingOrder.forEach((go: string) => {
    const members = nodes.filter((n: any) => n.decorationType.toLowerCase() === go.toLowerCase());
    if (members.length > 0) {
      groupings.push({ name: go, minRank: null, maxRank: null, members, topNodes: [], width: scr?.width || 1000, x: 0 });
    }
  });

  const crawlInGroup = (node: any) => {
    node.children.forEach((child: any) => {
      if (!child.rank && child.groupingIndex === node.groupingIndex) {
        child.rank = node.rank + 1;
        maxRank = Math.max(maxRank, node.rank + 1);
        crawlInGroup(child);
      }
    });
  };

  groupings.forEach((grouping) => {
    grouping.minRank = maxRank;
    grouping.members.sort((b: any, a: any) => b.preRank - a.preRank);
    grouping.members.forEach((node: any) => {
      if (!node.rank || !node.parent || node.parent.groupingIndex !== node.groupingIndex) {
        node.rank = grouping.minRank;
        crawlInGroup(node);
      }
    });
    grouping.members.forEach((node: any) => { if (!node.rank) node.rank = grouping.minRank; });
    grouping.maxRank = maxRank;
    maxRank++;
  });

  return mergeDeepRight(props, { extras: { groupings, maxRank } });
};

const orderNodesWithMaxPreRank = orderNodes(
  (node) => node.preRank,
  ({ extras: { maxPreRank } }: any) => maxPreRank,
);

const positionNodes = ({
  data: { nodes },
  options: { horizontalNodeSpacing, verticalNodeSpacing },
}: any) => {
  const nodesToAssignCoords = nodes.filter(shouldAssignCoords);
  const coords = nodesToAssignCoords.map(({ id, order, rank }: any) => ({
    id,
    x: order * horizontalNodeSpacing,
    y: rank * verticalNodeSpacing,
  }));
  const coordsByNodeId = new Map(getCoordsKeyValuePairs(coords));
  nodesToAssignCoords.forEach(assignCoords(({ id }: any) => coordsByNodeId.get(id)));
};

const renderDecorations = ({
  data: { shapes },
  extras: { groupings },
  options: { decoratorSpacing, verticalNodeSpacing },
}: any) => {
  if (shapes?.length) {
    shapes.forEach((decoration: any) => {
      const match = groupings.find(
        (g: any) => g.name.toLowerCase() === decoration.group?.toLowerCase(),
      );
      if (match) {
        decoration.y = match.minRank * verticalNodeSpacing - verticalNodeSpacing / 2 + decoratorSpacing / 2;
        decoration.height = (match.maxRank - match.minRank + 1) * verticalNodeSpacing - decoratorSpacing;
        decoration.x = 0;
        decoration.width = match.width;
        decoration.visible = true;
      } else {
        decoration.visible = false;
      }
    });
  }
};

function layoutNodes(props: any): any {
  resetNodes(props);
  const ranked = rankNodes(props);
  const grouped = groupNodes(ranked);
  orderNodesWithMaxPreRank(grouped);
  positionNodes(grouped);
  renderDecorations(grouped);
  return grouped;
}

// ── Default options ───────────────────────────────────────────────────────────

const defaultOptions = {
  horizontalNodeSpacing: 100,
  verticalNodeSpacing: 200,
  decoratorSpacing: 20,
  groupingOrder: [
    'businessservice',
    'itservice',
    'deviceservice',
    'application',
    'applicationcomponent',
    'device',
    'unknown',
  ],
};

// ── Exported layouter ─────────────────────────────────────────────────────────

const tieredLayout = (data: any, options: any, scr: any, onStopped?: () => void) => {
  const allOptions = options ? mergeDeepRight(defaultOptions, options) : { ...defaultOptions };
  const { nodeMap, edgeMap } = data;

  const nodes: any[] = [];
  const edges: any[] = [];
  nodeMap.forEach((value: any) => nodes.push(value));
  edgeMap.forEach((value: any) => edges.push(value));

  layoutNodes({ data: { nodes, edges, shapes: data.shapes }, options: allOptions, scr });
  if (onStopped) onStopped();
  return true;
};

export default tieredLayout;
