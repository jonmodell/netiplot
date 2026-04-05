/* eslint-disable no-param-reassign */
import { deepMerge } from '../util';
import {
  assignCoords,
  assignEdgeParentChild,
  compareByMass,
  compareByParentChild,
  crawl,
  getCoordsKeyValuePairs,
  orderNodes,
  scaleCoords,
  scaleCoordsByScreenSize,
  shouldAssignCoords,
} from './utils';

const clearNodes = ({ data: { nodes } }: any) => {
  nodes.forEach((node: any) => {
    node.rank = null;
    node.order = null;
    node.isChild = false;
    node.isParent = false;
    node.children = [];
    delete node.parent;
  });
};

const rankNodes = (props: any) => {
  const { edges, nodes } = props.data;
  const { isDirected } = props.options;
  let maxRank = 0;

  const setRank = (node: any, child: any) => {
    child.rank = node.rank + 1;
    maxRank = Math.max(maxRank, child.rank);
  };

  const crawlAndSetRank = crawl(props, setRank);

  const assignRank = (node: any) => {
    if (node.rank === null) {
      node.rank = 0;
      crawlAndSetRank(node);
    }
  };

  if (isDirected) {
    edges.forEach(assignEdgeParentChild);
    nodes.sort(compareByParentChild).forEach(assignRank);
  } else {
    nodes.sort(compareByMass).forEach((node: any) => {
      if (node.rank === null) {
        node.rank = 0;
        crawlAndSetRank(node);
      }
    });
  }
  return deepMerge(props, { extras: { maxRank } });
};

const orderNodesWithRank = orderNodes();

const positionNodes = ({
  data: { nodes },
  options: {
    direction,
    horizontalNodeSpacing,
    verticalNodeSpacing,
    spaceNodesByScreenSize,
  },
  extras: { maxRank },
  scr,
}: any) => {
  const nodesToAssignCoords = nodes.filter(shouldAssignCoords);
  const coords = nodesToAssignCoords.map((node: any) => {
    let x;
    let y;
    if (['UD', 'DU'].includes(direction)) {
      x = node.order || 0;
      y = direction === 'DU' ? maxRank - node.rank : node.rank;
    } else {
      x = direction === 'RL' ? maxRank - node.rank : node.rank;
      y = node.order || 0;
    }
    return { id: node.id, x, y };
  });

  const spacingFn = spaceNodesByScreenSize
    ? scaleCoordsByScreenSize(coords, scr)
    : scaleCoords(horizontalNodeSpacing, verticalNodeSpacing);
  const coordsWithSpacing = coords.map(spacingFn);
  const coordsByNodeId = new Map(getCoordsKeyValuePairs(coordsWithSpacing));
  nodesToAssignCoords.forEach(assignCoords(({ id }: any) => coordsByNodeId.get(id)));
};

const layoutNodes = (props: any) => {
  clearNodes(props);
  const ranked = rankNodes(props);
  orderNodesWithRank(ranked);
  positionNodes(ranked);
};

const defaultOptions = {
  horizontalNodeSpacing: 100,
  verticalNodeSpacing: 200,
  isDirected: false,
  spaceNodesByScreenSize: true,
  direction: 'UD',
};

const hierarchical = (data: any, options: any, scr: any, onStopped?: () => void) => {
  const opts = deepMerge(defaultOptions, options);
  const { nodeMap, edgeMap } = data;

  const nodes: any[] = [];
  const edges: any[] = [];
  nodeMap.forEach((value: any) => {
    nodes.push(value);
  });

  edgeMap.forEach((value: any) => {
    edges.push(value);
  });
  layoutNodes({ data: { nodes, edges }, scr, options: opts });
  nodes.forEach((n: any) => {
    delete n.width;
    delete n.parent;
    delete n.isParent;
    delete n.isChild;
    delete n.children;
    delete n.order;
    delete n.rank;
  });

  if (onStopped) {
    onStopped();
  }

  return true;
};

export default hierarchical;
